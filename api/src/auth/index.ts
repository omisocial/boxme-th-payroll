import { createHash, randomBytes } from 'node:crypto'
import type { D1Database } from '../db/queries'
import { getUserByEmail, getUserById, getSessionById, deleteSession } from '../db/queries'

const SESSION_TTL_HOURS = 24

function sha256(s: string) {
  return createHash('sha256').update(s).digest('hex')
}

// Verify password against stored hash.
// Supports $seed$sha256$ prefix (first-login seed) and future $argon2$ prefix.
export async function verifyPassword(stored: string, candidate: string): Promise<boolean> {
  if (stored.startsWith('$seed$sha256$')) {
    const hash = stored.replace('$seed$sha256$', '')
    return sha256(candidate) === hash
  }
  // TODO: Argon2 WASM verification for upgraded hashes
  return false
}

// Hash a new password (for change-password flow) — simple SHA-256 for now,
// upgrade to Argon2 WASM when available on Workers runtime.
export async function hashPassword(password: string): Promise<string> {
  return `$seed$sha256$${sha256(password)}`
}

function newSessionToken() {
  return randomBytes(32).toString('hex')
}

export async function createSession(
  db: D1Database,
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const token = newSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000)
    .toISOString()
    .replace('T', ' ')
    .split('.')[0]

  await db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, ip, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `).bind(token, userId, expiresAt, ip ?? null, userAgent ?? null).run()

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
  db: D1Database,
  token: string | undefined
): Promise<AuthUser | null> {
  if (!token) return null
  const row = await getSessionById(db, token)
  if (!row || !row['active']) return null
  return {
    id: row['user_id'] as string,
    email: row['email'] as string,
    role: row['role'] as string,
    country_scope: row['country_scope'] as string,
    warehouse_id: row['warehouse_id'] as string | null,
    force_password_change: Boolean(row['force_password_change']),
  }
}

export async function loginUser(
  db: D1Database,
  email: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<{ token: string; user: AuthUser } | null> {
  const row = await getUserByEmail(db, email)
  if (!row) return null

  const valid = await verifyPassword(row['password_hash'] as string, password)
  if (!valid) return null

  await db.prepare(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`)
    .bind(row['id']).run()

  const token = await createSession(db, row['id'] as string, ip, userAgent)
  return {
    token,
    user: {
      id: row['id'] as string,
      email: row['email'] as string,
      role: row['role'] as string,
      country_scope: row['country_scope'] as string,
      warehouse_id: row['warehouse_id'] as string | null,
      force_password_change: Boolean(row['force_password_change']),
    },
  }
}

export async function logoutUser(db: D1Database, token: string): Promise<void> {
  await deleteSession(db, token)
}

export async function changePassword(
  db: D1Database,
  userId: string,
  newPassword: string
): Promise<void> {
  const hash = await hashPassword(newPassword)
  await db.prepare(`
    UPDATE users SET password_hash = ?, force_password_change = 0, updated_at = datetime('now')
    WHERE id = ?
  `).bind(hash, userId).run()
}
