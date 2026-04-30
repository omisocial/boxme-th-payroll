import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'
import { getSupabase, storageUpload, storageDownload, type SB } from '../db/supabase'

const periodsRouter = new Hono<{ Bindings: Env }>()

const createSchema = z.object({
  name: z.string().min(1),
  fromDate: z.string(),
  toDate: z.string(),
  warehouseId: z.string().uuid().optional(),
  country: z.string().default('TH'),
})

// GET /api/periods
periodsRouter.get('/', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const status = c.req.query('status')

  let query = sb.from('payroll_periods')
    .select(`
      *,
      payroll_period_lines(count),
      total_net:payroll_period_lines(net_pay_thb.sum())
    `)
    .eq('country_code', country)
    .order('from_date', { ascending: false })
    .limit(50)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    // Fallback: select without aggregates if not supported
    const { data: simple } = await sb.from('payroll_periods')
      .select('*')
      .eq('country_code', country)
      .order('from_date', { ascending: false })
      .limit(50)
    return c.json({ success: true, data: simple ?? [] })
  }

  return c.json({ success: true, data: data ?? [] })
})

// POST /api/periods
periodsRouter.post('/', ...guard('hr'), zValidator('json', createSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const body = c.req.valid('json')
  const country = user.country_scope === '*' ? body.country : user.country_scope

  const { data: created, error } = await sb.from('payroll_periods')
    .insert({
      country_code: country,
      warehouse_id: body.warehouseId ?? null,
      name: body.name,
      from_date: body.fromDate,
      to_date: body.toDate,
      created_by: user.email,
    })
    .select()
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: created }, 201)
})

// POST /api/periods/:id/lock
periodsRouter.post('/:id/lock', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const id = c.req.param('id')

  const { data: period } = await sb.from('payroll_periods')
    .select('status, country_code')
    .eq('id', id)
    .maybeSingle()

  if (!period) return c.json({ success: false, message: 'Not found' }, 404)
  const p = period as Record<string, unknown>
  if (p['status'] !== 'open') return c.json({ success: false, message: 'Period must be open to lock' }, 400)

  await aggregatePeriodLines(sb, id, p['country_code'] as string)

  await sb.from('payroll_periods')
    .update({ status: 'locked', locked_at: new Date().toISOString(), locked_by: user.email })
    .eq('id', id)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'lock', entity: 'payroll_period', entity_id: id,
  })
  return c.json({ success: true })
})

// POST /api/periods/:id/approve
periodsRouter.post('/:id/approve', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const id = c.req.param('id')

  const { data: period } = await sb.from('payroll_periods')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (!period) return c.json({ success: false, message: 'Not found' }, 404)
  const p = period as Record<string, unknown>
  if (p['status'] !== 'locked') return c.json({ success: false, message: 'Period must be locked to approve' }, 400)

  await sb.from('payroll_periods')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: user.email })
    .eq('id', id)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'approve', entity: 'payroll_period', entity_id: id,
  })
  return c.json({ success: true })
})

// POST /api/periods/:id/export?bank=K-BANK
periodsRouter.post('/:id/export', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const id = c.req.param('id')
  const bankCode = c.req.query('bank') ?? 'K-BANK'

  const { data: period } = await sb.from('payroll_periods')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!period) return c.json({ success: false, message: 'Not found' }, 404)
  const p = period as Record<string, unknown>
  if (p['status'] !== 'approved') return c.json({ success: false, message: 'Period must be approved before export' }, 400)

  const { data: template } = await sb.from('bank_export_templates')
    .select('*')
    .eq('country_code', p['country_code'])
    .eq('bank_code', bankCode)
    .eq('active', true)
    .maybeSingle()

  if (!template) return c.json({ success: false, message: `No template for bank: ${bankCode}` }, 404)
  const t = template as Record<string, unknown>

  const { data: lines } = await sb.from('payroll_period_lines')
    .select('*')
    .eq('period_id', id)
    .order('full_name')

  const columns = (t['columns_json'] as Array<{ header: string; field: string }>) ?? []
  const rows: string[][] = [columns.map(col => col.header)]

  for (const line of lines ?? []) {
    const l = line as Record<string, unknown>
    rows.push(columns.map(col => {
      if (col.field === 'period_name') return String(p['name'] ?? '')
      const val = l[col.field]
      return val != null ? String(val) : ''
    }))
  }

  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
  const filename = `${String(p['name']).replace(/\s+/g, '_')}_${bankCode}_${new Date().toISOString().split('T')[0]}.csv`
  const storagePath = `${String(p['country_code'])}/${id}/${filename}`

  try {
    await storageUpload(sb, 'payroll-exports', storagePath, csv, 'text/csv; charset=utf-8')
  } catch {
    console.warn('[export] Storage upload failed (bucket may not exist yet)')
  }

  const { data: exportRow, error: exportErr } = await sb.from('bank_exports')
    .insert({
      period_id: id,
      bank_code: bankCode,
      filename,
      storage_path: storagePath,
      row_count: lines?.length ?? 0,
      total_thb: (lines ?? []).reduce((s, l) => s + (Number((l as Record<string, unknown>)['net_pay_thb']) || 0), 0),
      created_by: user.email,
    })
    .select('id')
    .single()

  if (exportErr) return c.json({ success: false, message: exportErr.message }, 500)

  await sb.from('payroll_periods')
    .update({ status: 'exported', updated_at: new Date().toISOString() })
    .eq('id', id)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'export', entity: 'payroll_period', entity_id: id,
    after: { bank: bankCode, filename, rows: lines?.length },
  })

  const exportId = (exportRow as Record<string, unknown>)['id'] as string
  return c.json({ success: true, data: { exportId, filename, rowCount: lines?.length ?? 0 } })
})

// GET /api/periods/:id/exports
periodsRouter.get('/:id/exports', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const { data } = await sb.from('bank_exports')
    .select('*')
    .eq('period_id', c.req.param('id'))
    .order('created_at', { ascending: false })
  return c.json({ success: true, data: data ?? [] })
})

// GET /api/periods/exports/:exportId/download — stream from Supabase Storage
periodsRouter.get('/exports/:exportId/download', ...guard('hr'), async (c) => {
  const sb = getSupabase(c.env)
  const { data: row } = await sb.from('bank_exports')
    .select('storage_path, filename')
    .eq('id', c.req.param('exportId'))
    .maybeSingle()

  if (!row) return c.json({ success: false, message: 'Not found' }, 404)
  const r = row as Record<string, unknown>

  try {
    const content = await storageDownload(sb, 'payroll-exports', r['storage_path'] as string)
    return new Response(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${r['filename']}"`,
      },
    })
  } catch {
    return c.json({ success: false, message: 'File not found in storage' }, 404)
  }
})

// GET /api/periods/summary/:id
periodsRouter.get('/summary/:id', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const id = c.req.param('id')

  const { data: period } = await sb.from('payroll_periods')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!period) return c.json({ success: false, message: 'Not found' }, 404)

  const { data: lines } = await sb.from('payroll_period_lines')
    .select('total_gross_thb, total_ot_thb, total_late_thb, total_damage_thb, net_pay_thb, shifts')
    .eq('period_id', id)

  const stats = (lines ?? []).reduce((acc, l: Record<string, unknown>) => {
    acc.worker_count++
    acc.total_gross = (acc.total_gross ?? 0) + (Number(l['total_gross_thb']) || 0)
    acc.total_ot = (acc.total_ot ?? 0) + (Number(l['total_ot_thb']) || 0)
    acc.total_late = (acc.total_late ?? 0) + (Number(l['total_late_thb']) || 0)
    acc.total_damage = (acc.total_damage ?? 0) + (Number(l['total_damage_thb']) || 0)
    acc.total_net = (acc.total_net ?? 0) + (Number(l['net_pay_thb']) || 0)
    acc.total_shifts = (acc.total_shifts ?? 0) + (Number(l['shifts']) || 0)
    return acc
  }, { worker_count: 0, total_gross: 0, total_ot: 0, total_late: 0, total_damage: 0, total_net: 0, total_shifts: 0 })

  return c.json({ success: true, data: { period, stats } })
})

async function aggregatePeriodLines(sb: SB, periodId: string, country: string) {
  const { data: period } = await sb.from('payroll_periods')
    .select('from_date, to_date')
    .eq('id', periodId)
    .maybeSingle()

  if (!period) return
  const p = period as Record<string, unknown>

  // Clear existing lines
  await sb.from('payroll_period_lines').delete().eq('period_id', periodId)

  // Fetch all attendance records in range with payroll data
  const { data: records } = await sb.from('attendance_records')
    .select('id, full_name, payroll_daily(gross_wage_thb, ot_pay_thb, late_deduction_thb, damage_thb)')
    .eq('country_code', country)
    .gte('work_date', p['from_date'] as string)
    .lte('work_date', p['to_date'] as string)
    .is('deleted_at', null)

  if (!records?.length) return

  // Aggregate by full_name
  const byName: Record<string, {
    full_name: string
    shifts: number
    total_gross_thb: number
    total_ot_thb: number
    total_late_thb: number
    total_damage_thb: number
    net_pay_thb: number
    worker_id?: string
    bank_code?: string
    bank_account?: string
  }> = {}

  for (const rec of records) {
    const r = rec as Record<string, unknown>
    const pd = r['payroll_daily'] as Record<string, unknown> | null
    if (!pd) continue

    const name = r['full_name'] as string
    if (!byName[name]) {
      byName[name] = { full_name: name, shifts: 0, total_gross_thb: 0, total_ot_thb: 0, total_late_thb: 0, total_damage_thb: 0, net_pay_thb: 0 }
    }
    const acc = byName[name]
    acc.shifts++
    acc.total_gross_thb += Number(pd['gross_wage_thb']) || 0
    acc.total_ot_thb += Number(pd['ot_pay_thb']) || 0
    acc.total_late_thb += Number(pd['late_deduction_thb']) || 0
    acc.total_damage_thb += Number(pd['damage_thb']) || 0
    acc.net_pay_thb += Number(pd['gross_wage_thb']) || 0
  }

  // Look up worker bank details
  const names = Object.keys(byName)
  if (names.length) {
    const { data: workers } = await sb.from('workers')
      .select('name_local, id, bank_code, bank_account')
      .eq('country_code', country)
      .in('name_local', names)

    for (const w of workers ?? []) {
      const ww = w as Record<string, unknown>
      const acc = byName[ww['name_local'] as string]
      if (acc) {
        acc.worker_id = ww['id'] as string
        acc.bank_code = ww['bank_code'] as string | undefined
        acc.bank_account = ww['bank_account'] as string | undefined
      }
    }
  }

  const lines = Object.values(byName).map(acc => ({
    period_id: periodId,
    worker_id: acc.worker_id ?? null,
    full_name: acc.full_name,
    bank_code: acc.bank_code ?? null,
    bank_account: acc.bank_account ?? null,
    shifts: acc.shifts,
    total_gross_thb: acc.total_gross_thb,
    total_ot_thb: acc.total_ot_thb,
    total_late_thb: acc.total_late_thb,
    total_damage_thb: acc.total_damage_thb,
    net_pay_thb: acc.net_pay_thb,
  }))

  if (lines.length) {
    await sb.from('payroll_period_lines').insert(lines)
  }
}

export { periodsRouter }
