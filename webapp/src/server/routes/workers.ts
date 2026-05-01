import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'
import { getSupabase } from '../db/supabase'

const workersRouter = new Hono<{ Bindings: Env }>()

const workerCreateSchema = z.object({
  warehouseId: z.string().uuid(),
  code: z.string().min(1),
  nameLocal: z.string().min(1),
  nameEn: z.string().optional(),
  departmentCode: z.string().optional(),
  shiftCode: z.string().optional(),
  gradeId: z.string().uuid().optional(),
  jobTypeCode: z.string().default('GENERAL'),
  bankCode: z.string().optional(),
  bankAccount: z.string().optional(),
  phone: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/warehouses — list warehouses by country (used in period create dialog)
workersRouter.get('/warehouses', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope

  const { data, error } = await sb.from('warehouses')
    .select('id, name, country_code')
    .eq('country_code', country)
    .order('name')

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

// GET /api/workers
workersRouter.get('/', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const dept = c.req.query('dept')
  const status = c.req.query('status') ?? 'active'
  const q = c.req.query('q')
  const jobType = c.req.query('job_type')
  const warehouseId = c.req.query('warehouse_id')
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 200)
  const offset = (page - 1) * limit

  let query = sb.from('workers')
    .select('*', { count: 'exact' })
    .eq('country_code', country)
    .is('deleted_at', null)

  if (status !== 'all') query = query.eq('status', status)
  if (dept) query = query.eq('department_code', dept)
  if (jobType) query = query.eq('job_type_code', jobType)
  if (warehouseId) query = query.eq('warehouse_id', warehouseId)
  if (q) query = query.or(`name_local.ilike.%${q}%,name_en.ilike.%${q}%,code.ilike.%${q}%`)

  const { data, count, error } = await query
    .order('name_local')
    .range(offset, offset + limit - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)

  const masked = (data ?? []).map((w: Record<string, unknown>) => ({
    ...w,
    bank_account: user.role === 'viewer' ? maskAccount(w['bank_account'] as string) : w['bank_account'],
  }))

  return c.json({
    success: true,
    data: masked,
    meta: { total: count ?? 0, page, limit },
  })
})

// GET /api/workers/:id
workersRouter.get('/:id', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope

  const { data: row, error } = await sb.from('workers')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('country_code', country)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return c.json({ success: false, message: error.message }, 500)
  if (!row) return c.json({ success: false, message: 'Not found' }, 404)

  const w = row as Record<string, unknown>
  if (user.role === 'viewer') w['bank_account'] = maskAccount(w['bank_account'] as string)
  return c.json({ success: true, data: w })
})

// POST /api/workers
workersRouter.post('/', ...guard('hr'), zValidator('json', workerCreateSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')

  const { data: created, error } = await sb.from('workers')
    .insert({
      country_code: country,
      warehouse_id: body.warehouseId,
      code: body.code,
      name_local: body.nameLocal,
      name_en: body.nameEn ?? null,
      department_code: body.departmentCode ?? null,
      shift_code: body.shiftCode ?? null,
      grade_id: body.gradeId ?? null,
      job_type_code: body.jobTypeCode,
      bank_code: body.bankCode ?? null,
      bank_account: body.bankAccount ?? null,
      phone: body.phone ?? null,
      start_date: body.startDate ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'create', entity: 'worker',
    entity_id: (created as Record<string, unknown>)['id'] as string,
    country_code: country,
    after: body,
  })

  return c.json({ success: true, data: created }, 201)
})

// PATCH /api/workers/:id
workersRouter.patch('/:id', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const id = c.req.param('id')

  const { data: before } = await sb.from('workers')
    .select('*')
    .eq('id', id)
    .eq('country_code', country)
    .is('deleted_at', null)
    .maybeSingle()

  if (!before) return c.json({ success: false, message: 'Not found' }, 404)

  const body = await c.req.json<Record<string, unknown>>()
  const allowed = ['name_local','name_en','department_code','shift_code','grade_id',
    'job_type_code','bank_code','bank_account','phone','start_date','end_date','status','notes']

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updateData[k] = v
  }

  if (Object.keys(updateData).length <= 1) {
    return c.json({ success: false, message: 'No valid fields' }, 400)
  }

  const { data: updated, error } = await sb.from('workers')
    .update(updateData)
    .eq('id', id)
    .eq('country_code', country)
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'update', entity: 'worker', entity_id: id, country_code: country,
    before, after: body,
  })

  return c.json({ success: true, data: updated })
})

// GET /api/workers/:id/payments — payroll period lines for one worker
workersRouter.get('/:id/payments', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const workerId = c.req.param('id')

  const { data: worker } = await sb.from('workers')
    .select('id')
    .eq('id', workerId)
    .eq('country_code', country)
    .maybeSingle()

  if (!worker) return c.json({ success: false, message: 'Not found' }, 404)

  const { data, error } = await sb.from('payroll_period_lines')
    .select('id, period_id, shifts, total_gross_thb, total_ot_thb, total_late_thb, total_damage_thb, net_pay_thb, computed_at, payroll_periods(name, from_date, to_date, status)')
    .eq('worker_id', workerId)
    .order('computed_at', { ascending: false })
    .limit(24)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

// GET /api/workers/:id/attendance — recent attendance records for one worker
workersRouter.get('/:id/attendance', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const workerId = c.req.param('id')
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '30'), 100)
  const offset = (page - 1) * limit

  const { data: worker } = await sb.from('workers')
    .select('id')
    .eq('id', workerId)
    .eq('country_code', country)
    .maybeSingle()

  if (!worker) return c.json({ success: false, message: 'Not found' }, 404)

  const { data, count, error } = await sb.from('attendance_records')
    .select('id, work_date, checkin, checkout, shift_code, job_type_code, note, status, ot_before_hours, ot_after_hours', { count: 'exact' })
    .eq('worker_id', workerId)
    .is('deleted_at', null)
    .order('work_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [], meta: { total: count ?? 0, page, limit } })
})

// DELETE /api/workers/:id — soft delete
workersRouter.delete('/:id', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const id = c.req.param('id')

  await sb.from('workers')
    .update({ deleted_at: new Date().toISOString(), status: 'resigned' })
    .eq('id', id)
    .eq('country_code', country)

  await appendAuditLog(sb, {
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
