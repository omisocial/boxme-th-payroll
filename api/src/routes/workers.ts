import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, getAccessibleWarehouseIds, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'
import { bulkResolveWorkers } from '../services/worker-resolver'

const workersRouter = new Hono<{ Bindings: Env }>()

// POST /api/workers/resolve — match attendance names to workers, auto-create
// missing ones with status='pending_update'.
const resolveSchema = z.object({
  warehouseId: z.string(),
  fullNames: z.array(z.string()).min(1),
})
workersRouter.post('/resolve', ...guard('hr'), zValidator('json', resolveSchema), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const { warehouseId, fullNames } = c.req.valid('json')

  // Verify the user can target this warehouse.
  const allowed = await getAccessibleWarehouseIds(c.env.DB, user)
  if (allowed !== '*' && !allowed.includes(warehouseId)) {
    return c.json({ success: false, message: 'Forbidden: no access to warehouse' }, 403)
  }

  const results = await bulkResolveWorkers(c.env.DB, country, warehouseId, fullNames)
  const created = results.filter(r => r.created).length
  return c.json({ success: true, data: { results, summary: { total: results.length, created } } })
})

const workerCreateSchema = z.object({
  warehouseId: z.string(),
  code: z.string().min(1),
  nameLocal: z.string().min(1),
  nameEn: z.string().optional(),
  departmentCode: z.string().optional(),
  shiftCode: z.string().optional(),
  gradeId: z.string().optional(),
  jobTypeCode: z.string().default('GENERAL'),
  bankCode: z.string().optional(),
  bankAccount: z.string().optional(),
  phone: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/workers
workersRouter.get('/', ...guard('viewer'), async (c) => {
  const user = c.get('user')
  const country = c.req.query('country') ?? user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const dept = c.req.query('dept')
  const status = c.req.query('status') ?? 'active'
  const q = c.req.query('q')
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 200)
  const offset = (page - 1) * limit

  let query = `SELECT * FROM workers WHERE country_code = ? AND deleted_at IS NULL`
  const params: unknown[] = [country]

  if (status !== 'all') { query += ` AND status = ?`; params.push(status) }
  if (dept) { query += ` AND department_code = ?`; params.push(dept) }
  if (q) { query += ` AND (name_local LIKE ? OR name_en LIKE ? OR code LIKE ?)`; params.push(`%${q}%`, `%${q}%`, `%${q}%`) }

  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as cnt')
  const totalRow = await c.env.DB.prepare(countQuery).bind(...params).first<{ cnt: number }>()

  query += ` ORDER BY name_local LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all<Record<string, unknown>>()

  // Mask bank_account for viewer role
  const masked = (results ?? []).map(w => ({
    ...w,
    bank_account: user.role === 'viewer' ? maskAccount(w['bank_account'] as string) : w['bank_account'],
  }))

  return c.json({
    success: true,
    data: masked,
    meta: { total: totalRow?.cnt ?? 0, page, limit },
  })
})

// GET /api/workers/:id
workersRouter.get('/:id', ...guard('viewer'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const row = await c.env.DB.prepare(
    'SELECT * FROM workers WHERE id = ? AND country_code = ? AND deleted_at IS NULL'
  ).bind(c.req.param('id'), country).first<Record<string, unknown>>()

  if (!row) return c.json({ success: false, message: 'Not found' }, 404)

  if (user.role === 'viewer') row['bank_account'] = maskAccount(row['bank_account'] as string)
  return c.json({ success: true, data: row })
})

// POST /api/workers
workersRouter.post('/', ...guard('hr'), zValidator('json', workerCreateSchema), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')

  const id = crypto.randomUUID()
  await c.env.DB.prepare(`
    INSERT INTO workers (id, country_code, warehouse_id, code, name_local, name_en,
      department_code, shift_code, grade_id, job_type_code,
      bank_code, bank_account, phone, start_date, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    id, country, body.warehouseId, body.code, body.nameLocal, body.nameEn ?? null,
    body.departmentCode ?? null, body.shiftCode ?? null, body.gradeId ?? null, body.jobTypeCode,
    body.bankCode ?? null, body.bankAccount ?? null, body.phone ?? null,
    body.startDate ?? null, body.notes ?? null
  ).run()

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'create', entity: 'worker', entity_id: id, country_code: country,
    after: body,
  })

  const created = await c.env.DB.prepare('SELECT * FROM workers WHERE id = ?').bind(id).first()
  return c.json({ success: true, data: created }, 201)
})

// PATCH /api/workers/:id
workersRouter.patch('/:id', ...guard('hr'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const id = c.req.param('id')

  const before = await c.env.DB.prepare(
    'SELECT * FROM workers WHERE id = ? AND country_code = ? AND deleted_at IS NULL'
  ).bind(id, country).first()
  if (!before) return c.json({ success: false, message: 'Not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const allowed = ['name_local','name_en','department_code','shift_code','grade_id',
    'job_type_code','bank_code','bank_account','phone','start_date','end_date','status','notes']

  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) { sets.push(`${k} = ?`); vals.push(v) }
  }
  if (!sets.length) return c.json({ success: false, message: 'No valid fields' }, 400)

  sets.push("updated_at = datetime('now')")
  vals.push(id, country)

  await c.env.DB.prepare(
    `UPDATE workers SET ${sets.join(', ')} WHERE id = ? AND country_code = ?`
  ).bind(...vals).run()

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'update', entity: 'worker', entity_id: id, country_code: country,
    before, after: body,
  })

  const updated = await c.env.DB.prepare('SELECT * FROM workers WHERE id = ?').bind(id).first()
  return c.json({ success: true, data: updated })
})

// DELETE /api/workers/:id — soft delete
workersRouter.delete('/:id', ...guard('hr'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const id = c.req.param('id')

  await c.env.DB.prepare(
    `UPDATE workers SET deleted_at = datetime('now'), status = 'resigned' WHERE id = ? AND country_code = ?`
  ).bind(id, country).run()

  await appendAuditLog(c.env.DB, {
    user_id: user.id, user_email: user.email,
    action: 'delete', entity: 'worker', entity_id: id, country_code: country,
  })
  return c.json({ success: true })
})

function maskAccount(acc?: string): string {
  if (!acc || acc.length < 4) return '****'
  return '****' + acc.slice(-4)
}

export { workersRouter }
