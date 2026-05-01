import { createHash, randomBytes } from 'node:crypto'
import type { SB } from '../db/supabase'

const SESSION_TTL_HOURS = 24

function sha256(s: string) {
  return createHash('sha256').update(s).digest('hex')
}

export async function verifyPassword(stored: string, candidate: string): Promise<boolean> {
  if (stored.startsWith('$seed$sha256$')) {
    const hash = stored.replace('$seed$sha256$', '')
    return sha256(candidate) === hash
  }
  return false
}

export async function hashPassword(password: string): Promise<string> {
  return `$seed$sha256$${sha256(password)}`
}

function newSessionToken() {
  return randomBytes(32).toString('hex')
}

export async function createSession(
  sb: SB,
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const token = newSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString()
  await sb.from('sessions').insert({
    id: token,
    user_id: userId,
    expires_at: expiresAt,
    ip: ip ?? null,
    user_agent: userAgent ?? null,
  })
  return token
}

export interface AuthUser {
  id: string
  email: string
  role: string
  country_scope: string
  warehouse_id: string | null
  force_password_change: boolean
}

export async function resolveSession(
  sb: SB,
  token: string | undefined
): Promise<AuthUser | null> {
  if (!token) return null

  const { data: session } = await sb.from('sessions')
    .select('user_id')
    .eq('id', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return null
  const s = session as Record<string, unknown>

  const { data: user } = await sb.from('users')
    .select('id, email, role, country_scope, warehouse_id, force_password_change, active')
    .eq('id', s['user_id'])
    .eq('active', true)
    .maybeSingle()

  if (!user) return null
  const u = user as Record<string, unknown>
  return {
    id: u['id'] as string,
    email: u['email'] as string,
    role: u['role'] as string,
    country_scope: u['country_scope'] as string,
    warehouse_id: u['warehouse_id'] as string | null,
    force_password_change: Boolean(u['force_password_change']),
  }
}

export async function loginUser(
  sb: SB,
  email: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<{ token: string; user: AuthUser } | null> {
  const { data: row } = await sb.from('users')
    .select('*')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle()

  if (!row) return null
  const r = row as Record<string, unknown>

  const valid = await verifyPassword(r['password_hash'] as string, password)
  if (!valid) return null

  await sb.from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', r['id'])

  const token = await createSession(sb, r['id'] as string, ip, userAgent)
  return {
    token,
    user: {
      id: r['id'] as string,
      email: r['email'] as string,
      role: r['role'] as string,
      country_scope: r['country_scope'] as string,
      warehouse_id: r['warehouse_id'] as string | null,
      force_password_change: Boolean(r['force_password_change']),
    },
  }
}

export async function logoutUser(sb: SB, token: string): Promise<void> {
  await sb.from('sessions').delete().eq('id', token)
}

export async function changePassword(
  sb: SB,
  userId: string,
  newPassword: string
): Promise<void> {
  const hash = await hashPassword(newPassword)
  await sb.from('users')
    .update({
      password_hash: hash,
      force_password_change: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
}
