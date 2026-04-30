import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'

const periodsRouter = new Hono<{ Bindings: Env }>()

const createSchema = z.object({
  name: z.string().min(1),
  fromDate: z.string(),
  toDate: z.string(),
  warehouseId: z.string().optional(),
  country: z.string().default('TH'),
})

// GET /api/periods
periodsRouter.get('/', ...guard('viewer'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const status = c.req.query('status')

  let query = `SELECT p.*,
    (SELECT COUNT(*) FROM payroll_period_lines WHERE period_id = p.id) as worker_count,
    (SELECT SUM(net_pay_thb) FROM payroll_period_lines WHERE period_id = p.id) as total_net_thb
    FROM payroll_periods p WHERE p.country_code = ?`
  const params: unknown[] = [country]

  if (status) { query += ` AND p.status = ?`; params.push(status) }
  query += ` ORDER BY p.from_date DESC LIMIT 50`

  const { results } = await c.env.DB.prepare(query).bind(...params).all<Record<string, unknown>>()
  return c.json({ success: true, data: results ?? [] })
})

// POST /api/periods
periodsRouter.post('/', ...guard('hr'), zValidator('json', createSchema), async (c) => {
  const user = c.get('user')
  const body = c.req.valid('json')
  const country = user.country_scope === '*' ? body.country : user.country_scope
  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO payroll_periods (id, country_code, warehouse_id, name, from_date, to_date, created_by)
    VALUES (?,?,?,?,?,?,?)
  `).bind(id, country, body.warehouseId ?? null, body.name, body.fromDate, body.toDate, user.email).run()

  const created = await c.env.DB.prepare('SELECT * FROM payroll_periods WHERE id = ?').bind(id).first()
  return c.json({ success: true, data: created }, 201)
})

// POST /api/periods/:id/lock
periodsRouter.post('/:id/lock', ...guard('hr'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const period = await c.env.DB.prepare('SELECT * FROM payroll_periods WHERE id = ?')
    .bind(id).first<{ status: string }>()
  if (!period) return c.json({ success: false, message: 'Not found' }, 404)
  if (period.status !== 'open') return c.json({ success: false, message: 'Period must be open to lock' }, 400)

  // Aggregate payroll_period_lines from payroll_daily
  await aggregatePeriodLines(c.env.DB, id, user.country_scope === '*' ? 'TH' : user.country_scope)

  await c.env.DB.prepare(`
    UPDATE payroll_periods SET status='locked', locked_at=datetime('now'), locked_by=? WHERE id=?
  `).bind(user.email, id).run()

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'lock', entity: 'payroll_period', entity_id: id,
  })
  return c.json({ success: true })
})

// POST /api/periods/:id/approve
periodsRouter.post('/:id/approve', ...guard('country_admin'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const period = await c.env.DB.prepare('SELECT * FROM payroll_periods WHERE id = ?')
    .bind(id).first<{ status: string }>()
  if (!period) return c.json({ success: false, message: 'Not found' }, 404)
  if (period.status !== 'locked') return c.json({ success: false, message: 'Period must be locked to approve' }, 400)

  await c.env.DB.prepare(`
    UPDATE payroll_periods SET status='approved', approved_at=datetime('now'), approved_by=? WHERE id=?
  `).bind(user.email, id).run()

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'approve', entity: 'payroll_period', entity_id: id,
  })
  return c.json({ success: true })
})

// POST /api/periods/:id/export?bank=K-BANK
periodsRouter.post('/:id/export', ...guard('hr'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  const bankCode = c.req.query('bank') ?? 'K-BANK'

  const period = await c.env.DB.prepare('SELECT * FROM payroll_periods WHERE id = ?')
    .bind(id).first<{ status: string; country_code: string; name: string; from_date: string; to_date: string }>()
  if (!period) return c.json({ success: false, message: 'Not found' }, 404)
  if (period.status !== 'approved') return c.json({ success: false, message: 'Period must be approved before export' }, 400)

  const template = await c.env.DB.prepare(
    'SELECT * FROM bank_export_templates WHERE country_code = ? AND bank_code = ? AND active = 1'
  ).bind(period.country_code, bankCode).first<{ columns_json: string; format: string; encoding: string; bank_name: string }>()

  if (!template) return c.json({ success: false, message: `No template for bank: ${bankCode}` }, 404)

  const { results: lines } = await c.env.DB.prepare(
    'SELECT * FROM payroll_period_lines WHERE period_id = ? ORDER BY full_name'
  ).bind(id).all<Record<string, unknown>>()

  const columns = JSON.parse(template.columns_json) as Array<{ header: string; field: string }>
  const rows: string[][] = [columns.map(c => c.header)]

  for (const line of lines ?? []) {
    rows.push(columns.map(col => {
      if (col.field === 'period_name') return period.name
      const val = line[col.field]
      return val != null ? String(val) : ''
    }))
  }

  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const filename = `${period.name.replace(/\s+/g, '_')}_${bankCode}_${new Date().toISOString().split('T')[0]}.csv`
  const r2Key = `exports/${id}/${filename}`

  await c.env.FILES.put(r2Key, csv, { httpMetadata: { contentType: 'text/csv; charset=utf-8' } })

  const exportId = crypto.randomUUID()
  await c.env.DB.prepare(`
    INSERT INTO bank_exports (id, period_id, bank_code, filename, r2_key, row_count, total_thb, created_by)
    VALUES (?,?,?,?,?,?,?,?)
  `).bind(
    exportId, id, bankCode, filename, r2Key,
    lines?.length ?? 0,
    lines?.reduce((s, l) => s + ((l['net_pay_thb'] as number) || 0), 0) ?? 0,
    user.email
  ).run()

  await c.env.DB.prepare(
    `UPDATE payroll_periods SET status='exported', updated_at=datetime('now') WHERE id=?`
  ).bind(id).run()

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'export', entity: 'payroll_period', entity_id: id,
    after: { bank: bankCode, filename, rows: lines?.length },
  })

  return c.json({ success: true, data: { exportId, filename, rowCount: lines?.length ?? 0 } })
})

// GET /api/periods/:id/exports
periodsRouter.get('/:id/exports', ...guard('viewer'), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM bank_exports WHERE period_id = ? ORDER BY created_at DESC'
  ).bind(c.req.param('id')).all<Record<string, unknown>>()
  return c.json({ success: true, data: results ?? [] })
})

// GET /api/exports/:exportId/download — R2 signed URL (15min)
periodsRouter.get('/exports/:exportId/download', ...guard('hr'), async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM bank_exports WHERE id = ?')
    .bind(c.req.param('exportId')).first<{ r2_key: string; filename: string }>()
  if (!row) return c.json({ success: false, message: 'Not found' }, 404)

  // In Workers, stream R2 object directly (no signed URL on free tier)
  const obj = await c.env.FILES.get(row.r2_key)
  if (!obj) return c.json({ success: false, message: 'File not found in storage' }, 404)

  const content = await obj.text()
  return new Response(content, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${row.filename}"`,
    },
  })
})

// GET /api/reports/period-summary/:id
periodsRouter.get('/summary/:id', ...guard('viewer'), async (c) => {
  const id = c.req.param('id')

  const period = await c.env.DB.prepare('SELECT * FROM payroll_periods WHERE id = ?').bind(id).first<Record<string, unknown>>()
  if (!period) return c.json({ success: false, message: 'Not found' }, 404)

  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as worker_count,
      SUM(total_gross_thb) as total_gross,
      SUM(total_ot_thb) as total_ot,
      SUM(total_late_thb) as total_late,
      SUM(total_damage_thb) as total_damage,
      SUM(net_pay_thb) as total_net,
      SUM(shifts) as total_shifts
    FROM payroll_period_lines WHERE period_id = ?
  `).bind(id).first<Record<string, number>>()

  return c.json({ success: true, data: { period, stats } })
})

async function aggregatePeriodLines(db: D1Database, periodId: string, country: string) {
  const period = await db.prepare('SELECT * FROM payroll_periods WHERE id = ?')
    .bind(periodId).first<{ from_date: string; to_date: string }>()
  if (!period) return

  // Clear existing lines
  await db.prepare('DELETE FROM payroll_period_lines WHERE period_id = ?').bind(periodId).run()

  // Aggregate from payroll_daily + attendance_records + workers
  await db.prepare(`
    INSERT INTO payroll_period_lines (period_id, worker_id, full_name, bank_code, bank_account,
      shifts, total_gross_thb, total_ot_thb, total_late_thb, total_damage_thb, net_pay_thb)
    SELECT
      ? as period_id,
      w.id as worker_id,
      a.full_name,
      w.bank_code,
      w.bank_account,
      COUNT(a.id) as shifts,
      SUM(pd.gross_wage_thb) as total_gross_thb,
      SUM(pd.ot_pay_thb) as total_ot_thb,
      SUM(pd.late_deduction_thb) as total_late_thb,
      SUM(pd.damage_thb) as total_damage_thb,
      SUM(pd.gross_wage_thb) as net_pay_thb
    FROM attendance_records a
    JOIN payroll_daily pd ON pd.attendance_id = a.id
    LEFT JOIN workers w ON w.name_local = a.full_name AND w.country_code = a.country_code
    WHERE a.country_code = ? AND a.work_date BETWEEN ? AND ? AND a.deleted_at IS NULL
    GROUP BY a.full_name
  `).bind(periodId, country, period.from_date, period.to_date).run()
}

declare const D1Database: never
type D1Database = typeof globalThis extends { DB: infer T } ? T : Record<string, unknown>

export { periodsRouter }
