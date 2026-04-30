import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRouter } from './routes/auth'
import { workersRouter } from './routes/workers'
import { attendanceRouter } from './routes/attendance'
import { payrollRouter } from './routes/payroll'
import { periodsRouter } from './routes/periods'
import type { Env } from './auth/rbac'
import { getSupabase } from './db/supabase'

const app = new Hono<{ Bindings: Env }>()

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

app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }))

app.route('/api/auth', authRouter)
app.route('/api/workers', workersRouter)
app.route('/api/attendance', attendanceRouter)
app.route('/api/payroll', payrollRouter)
app.route('/api/periods', periodsRouter)

// Cron handler — nightly recompute (protected by secret header)
app.get('/api/_cron/recompute', async (c) => {
  const secret = c.req.header('x-cron-secret')
  if (!c.env.CRON_SECRET || secret !== c.env.CRON_SECRET) {
    return c.json({ ok: false }, 401)
  }

  const sb = getSupabase(c.env)

  const { data: openPeriods } = await sb.from('payroll_periods')
    .select('id, country_code')
    .eq('status', 'open')

  let total = 0
  for (const period of openPeriods ?? []) {
    const p = period as Record<string, unknown>
    const { count } = await sb.from('attendance_records')
      .select('id', { count: 'exact', head: true })
      .eq('country_code', p['country_code'])
      .is('deleted_at', null)

    total += count ?? 0
  }

  return c.json({ ok: true, recomputed: total })
})

export default app
