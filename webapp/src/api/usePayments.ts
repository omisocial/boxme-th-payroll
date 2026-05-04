import { useCallback, useEffect, useState } from 'react'

export interface PaymentLine {
  id: string
  period_id: string
  worker_id: string | null
  full_name: string
  bank_code: string | null
  bank_account: string | null
  shifts: number
  total_gross_thb: number
  total_ot_thb: number
  total_late_thb: number
  total_damage_thb: number
  net_pay_thb: number
  payment_status: 'unpaid' | 'paid'
  paid_at: string | null
  paid_by: string | null
  payment_note: string | null
  computed_at: string
  workers?: {
    id: string
    code: string
    name_local: string
    job_type_code: string
    department_code: string | null
  } | null
}

interface ApiResp<T> {
  success: boolean
  data?: T
  message?: string
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<ApiResp<T>> {
  const res = await fetch(path, { credentials: 'include', ...opts })
  return res.json()
}

export function usePayments(periodId: string | null) {
  const [lines, setLines] = useState<PaymentLine[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [q, setQ] = useState('')

  const refresh = useCallback(async () => {
    if (!periodId) {
      setLines([])
      return
    }
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ period_id: periodId })
    if (statusFilter !== 'all') params.set('payment_status', statusFilter)
    if (q) params.set('q', q)
    const json = await apiFetch<PaymentLine[]>(`/api/period-lines?${params}`)
    if (json.success && json.data) setLines(json.data)
    else setError(json.message ?? 'Failed to load payments')
    setLoading(false)
  }, [periodId, statusFilter, q])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setBulkStatus = useCallback(
    async (ids: string[], paymentStatus: 'unpaid' | 'paid', note?: string) => {
      const json = await apiFetch<unknown>('/api/period-lines/bulk-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, paymentStatus, note }),
      })
      if (json.success) await refresh()
      return json
    },
    [refresh]
  )

  const setOneStatus = useCallback(
    async (id: string, paymentStatus: 'unpaid' | 'paid', note?: string) => {
      const json = await apiFetch<unknown>(`/api/period-lines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus, note }),
      })
      if (json.success) await refresh()
      return json
    },
    [refresh]
  )

  return {
    lines,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    q,
    setQ,
    refresh,
    setBulkStatus,
    setOneStatus,
  }
}
