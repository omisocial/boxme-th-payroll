import type { Context, Next } from 'hono'
import { resolveSession, type AuthUser } from './index'

export type Env = {
  DB: D1Database
  FILES: R2Bucket
  SESSION_KV: KVNamespace
}

type Variables = {
  user: AuthUser
}

type HonoCtx = Context<{ Bindings: Env; Variables: Variables }>

const ROLE_RANK: Record<string, number> = {
  super_admin: 100,
  country_admin: 80,
  hr: 60,
  supervisor: 40,
  viewer: 20,
}

export function getSessionToken(c: HonoCtx): string | undefined {
  const cookie = c.req.header('cookie') ?? ''
  const match = cookie.match(/session=([^;]+)/)
  return match?.[1]
}

// Require authenticated session — attach user to context
export function requireAuth() {
  return async (c: HonoCtx, next: Next) => {
    const token = getSessionToken(c)
    const user = await resolveSession(c.env.DB, token)
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401)
    }
    c.set('user', user)
    return next()
  }
}

// Require one of the given roles (or higher)
export function requireRole(...roles: string[]) {
  return async (c: HonoCtx, next: Next) => {
    const user = c.get('user')
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)
    const minRank = Math.min(...roles.map(r => ROLE_RANK[r] ?? 0))
    if ((ROLE_RANK[user.role] ?? 0) < minRank) {
      return c.json({ success: false, message: 'Forbidden' }, 403)
    }
    return next()
  }
}

// Require user's country_scope matches the requested country
export function requireCountry(countryParam = 'country') {
  return async (c: HonoCtx, next: Next) => {
    const user = c.get('user')
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)
    if (user.country_scope === '*') return next() // super_admin / global viewer

    const requested =
      c.req.query('country') ??
      c.req.param(countryParam) ??
      c.req.header('x-country') ??
      'TH'

    if (user.country_scope !== requested) {
      return c.json({ success: false, message: 'Forbidden: wrong country scope' }, 403)
    }
    return next()
  }
}

// Combined: auth + country check (most common guard)
export function guard(minRole = 'viewer', countryParam = 'country') {
  return [requireAuth(), requireRole(minRole), requireCountry(countryParam)]
}

// Cookie helpers
export function setSessionCookie(c: HonoCtx, token: string) {
  c.header(
    'Set-Cookie',
    `session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 3600}`
  )
}

export function clearSessionCookie(c: HonoCtx) {
  c.header('Set-Cookie', 'session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0')
}

// Declare CF globals for TypeScript
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement
    exec(query: string): Promise<unknown>
    batch(statements: D1PreparedStatement[]): Promise<unknown[]>
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement
    first<T = unknown>(colName?: string): Promise<T | null>
    run(): Promise<unknown>
    all<T = unknown>(): Promise<{ results?: T[] }>
    raw<T = unknown[]>(): Promise<T[]>
  }
  interface R2Bucket {
    put(key: string, value: ArrayBuffer | ReadableStream | string, options?: unknown): Promise<unknown>
    get(key: string): Promise<R2Object | null>
    delete(key: string): Promise<void>
    list(options?: unknown): Promise<{ objects: R2Object[] }>
  }
  interface R2Object {
    key: string
    size: number
    body: ReadableStream
    arrayBuffer(): Promise<ArrayBuffer>
    text(): Promise<string>
  }
  interface KVNamespace {
    get(key: string): Promise<string | null>
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
    delete(key: string): Promise<void>
  }
}
