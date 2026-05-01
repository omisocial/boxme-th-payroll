import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRouter } from './routes/auth'
import { workersRouter } from './routes/workers'
import { attendanceRouter } from './routes/attendance'
import { payrollRouter } from './routes/payroll'
import { periodsRouter } from './routes/periods'
import type { Env } from './auth/rbac'

const app = new Hono<{ Bindings: Env }>()

// CORS — same-origin only (Pages Functions share domain, but allow dev localhost)
app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return '*'
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin
    if (origin.includes('boxme.tech') || origin.includes('pages.dev')) return origin
    return null
  },
  allowHeaders: ['Content-Type', 'X-Country'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// Health check
app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }))

// Mount routers
app.route('/api/auth', authRouter)
app.route('/api/workers', workersRouter)
app.route('/api/attendance', attendanceRouter)
app.route('/api/payroll', payrollRouter)
app.route('/api/periods', periodsRouter)

// Cron handler — nightly recompute
app.get('/api/_cron/recompute', async (c) => {
  // Protected by CF Cron Trigger — only called internally
  const secret = c.req.header('x-cron-secret')
  if (secret !== (c.env as unknown as Record<string, string>)['CRON_SECRET']) {
    return c.json({ ok: false }, 401)
  }

  const { results: openPeriods } = await c.env.DB.prepare(
    `SELECT id, country_code FROM payroll_periods WHERE status = 'open'`
  ).all<{ id: string; country_code: string }>()

  let total = 0
  for (const period of openPeriods ?? []) {
    const { results: rows } = await c.env.DB.prepare(`
      SELECT a.id FROM attendance_records a
      WHERE a.country_code = ?
        AND a.work_date BETWEEN
          (SELECT from_date FROM payroll_periods WHERE id = ?)
          AND (SELECT to_date FROM payroll_periods WHERE id = ?)
        AND a.deleted_at IS NULL
    `).bind(period.country_code, period.id, period.id).all<{ id: string }>()

    total += rows?.length ?? 0
  }

  return c.json({ ok: true, recomputed: total })
})

export default app
