// Typed D1 query helpers

export interface D1Database {
  prepare(query: string): D1PreparedStatement
  exec(query: string): Promise<D1ExecResult>
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>
  dump?(): Promise<ArrayBuffer>
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<D1Result>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown[]>(): Promise<T[]>
}

export interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  error?: string
  meta?: Record<string, unknown>
}

export interface D1ExecResult {
  count: number
  duration: number
}

// Resolve the effective rate config for a given country/dept/date
export async function resolveRateConfig(
  db: D1Database,
  country: string,
  dept: string | null,
  date: string
): Promise<{ base_daily: number; ot_multiplier: number } | null> {
  // Most specific first: country+dept match, then country-only
  const row = await db.prepare(`
    SELECT base_daily, ot_multiplier FROM rate_configs
    WHERE country_code = ?
      AND (department_code = ? OR department_code IS NULL)
      AND effective_from <= ?
    ORDER BY
      CASE WHEN department_code IS NOT NULL THEN 0 ELSE 1 END,
      effective_from DESC
    LIMIT 1
  `).bind(country, dept, date).first<{ base_daily: number; ot_multiplier: number }>()

  return row
}

export async function getUserByEmail(db: D1Database, email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ? AND active = 1')
    .bind(email)
    .first<Record<string, unknown>>()
}

export async function getUserById(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ? AND active = 1')
    .bind(id)
    .first<Record<string, unknown>>()
}

export async function getSessionById(db: D1Database, token: string) {
  return db.prepare(`
    SELECT s.*, u.role, u.country_scope, u.warehouse_id, u.force_password_change, u.email, u.active
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(token).first<Record<string, unknown>>()
}

export async function deleteSession(db: D1Database, token: string) {
  return db.prepare('DELETE FROM sessions WHERE id = ?').bind(token).run()
}

export async function appendAuditLog(
  db: D1Database,
  entry: {
    user_id?: string
    user_email?: string
    action: string
    entity: string
    entity_id?: string
    country_code?: string
    before?: unknown
    after?: unknown
    ip?: string
  }
) {
  await db.prepare(`
    INSERT INTO audit_log (user_id, user_email, action, entity, entity_id, country_code, before_json, after_json, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    entry.user_id ?? null,
    entry.user_email ?? null,
    entry.action,
    entry.entity,
    entry.entity_id ?? null,
    entry.country_code ?? null,
    entry.before ? JSON.stringify(entry.before) : null,
    entry.after ? JSON.stringify(entry.after) : null,
    entry.ip ?? null
  ).run()
}
