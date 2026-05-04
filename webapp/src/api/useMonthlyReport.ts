import { useCallback, useEffect, useState } from 'react'

export interface MonthlyReport {
  yearMonth: string
  periods: Array<{
    id: string
    name: string
    from_date: string
    to_date: string
    status: string
    warehouse_id: string | null
  }>
  kpi: {
    netTotal: number
    grossTotal: number
    otTotal: number
    deductTotal: number
    workerCount: number
    shifts: number
    paidCount: number
    unpaidCount: number
  }
  byDepartment: Array<{ dept: string; net: number; count: number }>
  byWarehouse: Array<{ warehouseId: string; net: number; count: number }>
  lines: Array<{
    id: string
    period_id: string
    full_name: string
    shifts: number
    total_gross_thb: number
    net_pay_thb: number
    payment_status: 'unpaid' | 'paid'
    workers?: { department_code: string | null; job_type_code: string } | null
  }>
  bankExports: Array<{
    id: string
    period_id: string
    bank_code: string
    filename: string
    row_count: number
    total_thb: number
    created_by: string
    created_at: string
  }>
}

export function useMonthlyReport(yearMonth: string, warehouseId?: string | null) {
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ yearMonth })
    if (warehouseId) params.set('warehouse_id', warehouseId)
    const res = await fetch(`/api/reports/monthly?${params}`, { credentials: 'include' })
    const json = await res.json()
    if (json.success && json.data) setReport(json.data as MonthlyReport)
    else setError(json.message ?? 'Failed to load report')
    setLoading(false)
  }, [yearMonth, warehouseId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { report, loading, error, refresh }
}
