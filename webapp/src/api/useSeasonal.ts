import { useState, useEffect, useCallback } from 'react'
import type { Worker } from './useWorkers'

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<{ success: boolean; data?: T; message?: string; meta?: { total: number; page: number; limit: number } }> {
  const res = await fetch(path, { credentials: 'include', ...opts })
  return res.json()
}

export interface PaymentLine {
  id: string
  period_id: string
  shifts: number
  total_gross_thb: number
  total_ot_thb: number
  total_late_thb: number
  total_damage_thb: number
  net_pay_thb: number
  computed_at: string
  payroll_periods: {
    name: string
    from_date: string
    to_date: string
    status: string
  } | null
}

export interface AttendanceRecord {
  id: string
  work_date: string
  checkin: string | null
  checkout: string | null
  shift_code: string | null
  job_type_code: string
  note: string | null
  status: string
  ot_before_hours: number
  ot_after_hours: number
}

export function useSeasonal(country: string) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('active')
  const [warehouseId, setWarehouseId] = useState('')
  const [page, setPage] = useState(1)

  const refresh = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      country,
      page: String(page),
      limit: '50',
      status,
      job_type: 'SEASONAL',
    })
    if (q) params.set('q', q)
    if (warehouseId) params.set('warehouse_id', warehouseId)
    const json = await apiFetch<Worker[]>(`/api/workers?${params}`)
    if (json.success && json.data) {
      setWorkers(json.data)
      setTotal(json.meta?.total ?? json.data.length)
    }
    setLoading(false)
  }, [country, page, q, status, warehouseId])

  useEffect(() => { refresh() }, [refresh])

  const createWorker = useCallback(async (data: Record<string, unknown>) => {
    const payload = { ...data, jobTypeCode: 'SEASONAL' }
    const json = await apiFetch<Worker>('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const updateWorker = useCallback(async (id: string, data: Record<string, unknown>) => {
    const json = await apiFetch<Worker>(`/api/workers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const toggleStatus = useCallback(async (worker: Worker, newStatus: 'active' | 'resigned' | 'suspended', actorEmail: string) => {
    const statusNote = `[${new Date().toISOString().slice(0, 10)}] Status: ${worker.status} → ${newStatus} by ${actorEmail}`
    const existingNotes = worker.notes ?? ''
    const notes = existingNotes ? `${existingNotes}\n${statusNote}` : statusNote
    const json = await apiFetch<Worker>(`/api/workers/${worker.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes }),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  return {
    workers, total, loading,
    q, setQ,
    status, setStatus,
    warehouseId, setWarehouseId,
    page, setPage,
    refresh,
    createWorker, updateWorker, toggleStatus,
  }
}

export function useWorkerPayments(workerId: string | null, country: string) {
  const [payments, setPayments] = useState<PaymentLine[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!workerId) { setPayments([]); return }
    setLoading(true)
    apiFetch<PaymentLine[]>(`/api/workers/${workerId}/payments?country=${country}`)
      .then(json => { if (json.success && json.data) setPayments(json.data) })
      .finally(() => setLoading(false))
  }, [workerId, country])

  return { payments, loading }
}

export function useWorkerAttendance(workerId: string | null, country: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const refresh = useCallback(async () => {
    if (!workerId) { setRecords([]); return }
    setLoading(true)
    const json = await apiFetch<AttendanceRecord[]>(`/api/workers/${workerId}/attendance?country=${country}&page=${page}&limit=30`)
    if (json.success && json.data) {
      setRecords(json.data)
      setTotal(json.meta?.total ?? json.data.length)
    }
    setLoading(false)
  }, [workerId, country, page])

  useEffect(() => { refresh() }, [refresh])

  return { records, total, loading, page, setPage, refresh }
}
