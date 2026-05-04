import type { Context, Next } from 'hono'
import { resolveProfile, type AuthUser } from './index'
import { getSupabase } from '../db/supabase'

export type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  DEFAULT_COUNTRY: string
  APP_URL: string
  RESEND_API_KEY?: string
  CRON_SECRET?: string
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

export function requireAuth() {
  return async (c: HonoCtx, next: Next) => {
    const authHeader = c.req.header('Authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
    if (!token) return c.json({ success: false, message: 'Unauthorized' }, 401)

    const sb = getSupabase(c.env)
    const { data: { user: authUser }, error } = await sb.auth.getUser(token)
    if (error || !authUser) return c.json({ success: false, message: 'Unauthorized' }, 401)

    const profile = await resolveProfile(sb, authUser.id)
    if (!profile) return c.json({ success: false, message: 'Unauthorized' }, 401)

    c.set('user', profile)
    return next()
  }
}

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

export function requireCountry(countryParam = 'country') {
  return async (c: HonoCtx, next: Next) => {
    const user = c.get('user')
    if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)
    if (user.country_scope === '*') return next()

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

export function guard(minRole = 'viewer', countryParam = 'country') {
  return [requireAuth(), requireRole(minRole), requireCountry(countryParam)]
}
