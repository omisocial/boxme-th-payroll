import { Hono } from 'hono'
import { guard, type Env } from '../auth/rbac'
import { getSupabase } from '../db/supabase'

const reportsRouter = new Hono<{ Bindings: Env }>()

interface PeriodRow {
  id: string
  name: string
  from_date: string
  to_date: string
  status: string
  warehouse_id: string | null
  country_code: string
}

interface LineRow {
  id: string
  period_id: string
  worker_id: string | null
  full_name: string
  shifts: number
  total_gross_thb: number
  total_ot_thb: number
  total_late_thb: number
  total_damage_thb: number
  net_pay_thb: number
  payment_status: 'unpaid' | 'paid'
  paid_at: string | null
  workers?: { department_code: string | null; warehouse_id: string | null; job_type_code: string } | null
}

// GET /api/reports/monthly?yearMonth=YYYY-MM[&warehouse_id=]
reportsRouter.get('/monthly', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const yearMonth = c.req.query('yearMonth') ?? new Date().toISOString().slice(0, 7)
  // If user is bound to a specific warehouse, force-scope to it (client cannot widen scope).
  const requestedWarehouseId = c.req.query('warehouse_id')
  const warehouseId = user.warehouse_id ?? requestedWarehouseId
  const country = user.country_scope === '*' ? c.req.query('country') ?? 'TH' : user.country_scope

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return c.json({ success: false, message: 'yearMonth must be YYYY-MM' }, 400)
  }

  const [year, month] = yearMonth.split('-').map(Number)
  const fromDate = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const toDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  // Fetch periods overlapping the month
  let pq = sb.from('payroll_periods')
    .select('id, name, from_date, to_date, status, warehouse_id, country_code')
    .eq('country_code', country)
    .lte('from_date', toDate)
    .gte('to_date', fromDate)

  if (warehouseId) pq = pq.eq('warehouse_id', warehouseId)

  const { data: periodsRaw, error: pErr } = await pq
  if (pErr) return c.json({ success: false, message: pErr.message }, 500)
  const periods = (periodsRaw ?? []) as PeriodRow[]

  if (periods.length === 0) {
    return c.json({
      success: true,
      data: {
        yearMonth,
        periods: [],
        kpi: { netTotal: 0, grossTotal: 0, otTotal: 0, deductTotal: 0, workerCount: 0, shifts: 0, paidCount: 0, unpaidCount: 0 },
        byDepartment: [],
        byWarehouse: [],
        lines: [],
      },
    })
  }

  const periodIds = periods.map(p => p.id)

  const { data: linesRaw, error: lErr } = await sb.from('payroll_period_lines')
    .select('*, workers(department_code, warehouse_id, job_type_code)')
    .in('period_id', periodIds)

  if (lErr) return c.json({ success: false, message: lErr.message }, 500)
  const lines = (linesRaw ?? []) as LineRow[]

  // KPI
  let netTotal = 0, grossTotal = 0, otTotal = 0, deductTotal = 0, shifts = 0, paidCount = 0, unpaidCount = 0
  const workerSet = new Set<string>()
  const deptMap = new Map<string, { dept: string; net: number; count: number }>()
  const whMap = new Map<string, { warehouseId: string; net: number; count: number }>()

  for (const l of lines) {
    netTotal += l.net_pay_thb || 0
    grossTotal += l.total_gross_thb || 0
    otTotal += l.total_ot_thb || 0
    deductTotal += (l.total_late_thb || 0) + (l.total_damage_thb || 0)
    shifts += l.shifts || 0
    if (l.payment_status === 'paid') paidCount++
    else unpaidCount++
    workerSet.add(l.full_name)

    const dept = l.workers?.department_code ?? '—'
    const dEntry = deptMap.get(dept) ?? { dept, net: 0, count: 0 }
    dEntry.net += l.net_pay_thb || 0
    dEntry.count++
    deptMap.set(dept, dEntry)

    const wh = l.workers?.warehouse_id ?? '—'
    const wEntry = whMap.get(wh) ?? { warehouseId: wh, net: 0, count: 0 }
    wEntry.net += l.net_pay_thb || 0
    wEntry.count++
    whMap.set(wh, wEntry)
  }

  // Bank exports for audit
  const { data: exportsRaw } = await sb.from('bank_exports')
    .select('id, period_id, bank_code, filename, row_count, total_thb, created_by, created_at')
    .in('period_id', periodIds)
    .order('created_at', { ascending: false })

  return c.json({
    success: true,
    data: {
      yearMonth,
      periods,
      kpi: {
        netTotal,
        grossTotal,
        otTotal,
        deductTotal,
        workerCount: workerSet.size,
        shifts,
        paidCount,
        unpaidCount,
      },
      byDepartment: Array.from(deptMap.values()).sort((a, b) => b.net - a.net),
      byWarehouse: Array.from(whMap.values()).sort((a, b) => b.net - a.net),
      lines,
      bankExports: exportsRaw ?? [],
    },
  })
})

export { reportsRouter }
