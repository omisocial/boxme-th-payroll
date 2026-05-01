import { useState, useEffect, useCallback } from 'react'

export interface Period {
  id: string
  country_code: string
  warehouse_id: string | null
  name: string
  from_date: string
  to_date: string
  status: 'open' | 'locked' | 'approved' | 'exported'
  created_by: string
  created_at: string
  locked_at: string | null
  locked_by: string | null
  approved_at: string | null
  approved_by: string | null
}

export interface PeriodStats {
  worker_count: number
  total_gross: number
  total_ot: number
  total_late: number
  total_damage: number
  total_net: number
  total_shifts: number
}

export interface BankExport {
  id: string
  period_id: string
  bank_code: string
  filename: string
  row_count: number
  total_thb: number
  created_at: string
}

export interface Warehouse {
  id: string
  name: string
  country_code: string
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(path, { credentials: 'include', ...opts })
  return res.json()
}

export function usePeriods(country = 'TH') {
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const json = await apiFetch<Period[]>(`/api/periods?country=${country}`)
    if (json.success && json.data) setPeriods(json.data)
    else setError(json.message ?? 'Failed to load periods')
    setLoading(false)
  }, [country])

  useEffect(() => { refresh() }, [refresh])

  const createPeriod = useCallback(async (data: {
    name: string
    fromDate: string
    toDate: string
    warehouseId?: string
    country: string
  }) => {
    const json = await apiFetch<Period>('/api/periods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) await refresh()
    return json
  }, [refresh])

  const lockPeriod = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/periods/${id}/lock`, { method: 'POST' })
    if (json.success) await refresh()
    return json
  }, [refresh])

  const approvePeriod = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/periods/${id}/approve`, { method: 'POST' })
    if (json.success) await refresh()
    return json
  }, [refresh])

  const exportPeriod = useCallback(async (id: string, bank = 'K-BANK') => {
    const json = await apiFetch<{ exportId: string; filename: string; rowCount: number }>(
      `/api/periods/${id}/export?bank=${bank}`,
      { method: 'POST' }
    )
    if (json.success) await refresh()
    return json
  }, [refresh])

  return { periods, loading, error, refresh, createPeriod, lockPeriod, approvePeriod, exportPeriod }
}

export function usePeriodSummary(periodId: string | null) {
  const [stats, setStats] = useState<PeriodStats | null>(null)
  const [period, setPeriod] = useState<Period | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!periodId) return
    setLoading(true)
    const json = await apiFetch<{ period: Period; stats: PeriodStats }>(`/api/periods/summary/${periodId}`)
    if (json.success && json.data) {
      setPeriod(json.data.period)
      setStats(json.data.stats)
    }
    setLoading(false)
  }, [periodId])

  useEffect(() => { refresh() }, [refresh])
  return { period, stats, loading, refresh }
}

export function usePeriodExports(periodId: string | null) {
  const [exports, setExports] = useState<BankExport[]>([])

  const refresh = useCallback(async () => {
    if (!periodId) return
    const json = await apiFetch<BankExport[]>(`/api/periods/${periodId}/exports`)
    if (json.success && json.data) setExports(json.data)
  }, [periodId])

  useEffect(() => { refresh() }, [refresh])
  return { exports, refresh }
}

export function useWarehouses(country = 'TH') {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  useEffect(() => {
    apiFetch<Warehouse[]>(`/api/workers/warehouses?country=${country}`)
      .then(json => { if (json.success && json.data) setWarehouses(json.data) })
  }, [country])

  return warehouses
}
