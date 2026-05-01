import { useState, useEffect, useCallback } from 'react'

export interface Worker {
  id: string
  country_code: string
  warehouse_id: string
  code: string
  name_local: string
  name_en: string | null
  department_code: string | null
  shift_code: string | null
  job_type_code: string
  bank_code: string | null
  bank_account: string | null
  phone: string | null
  start_date: string | null
  end_date: string | null
  status: 'active' | 'resigned' | 'terminated' | 'pending_update' | 'inactive' | 'suspended'
  created_via?: 'manual' | 'attendance_import' | 'api'
  notes: string | null
  created_at: string
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<{ success: boolean; data?: T; message?: string; meta?: { total: number } }> {
  const res = await fetch(path, { credentials: 'include', ...opts })
  return res.json()
}

export function useWorkers(country: string, warehouseId?: string | null) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('active')
  const [page, setPage] = useState(1)

  const refresh = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ country, page: String(page), limit: '50', status })
    if (q) params.set('q', q)
    if (warehouseId) params.set('warehouse_id', warehouseId)
    const json = await apiFetch<Worker[]>(`/api/workers?${params}`)
    if (json.success && json.data) {
      setWorkers(json.data)
      setTotal(json.meta?.total ?? json.data.length)
    }
    setLoading(false)
  }, [country, warehouseId, page, q, status])

  useEffect(() => { refresh() }, [refresh])

  const createWorker = useCallback(async (data: Partial<Worker> & { warehouseId: string; nameLocal: string; code: string }) => {
    const json = await apiFetch<Worker>('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const updateWorker = useCallback(async (id: string, data: Partial<Worker>) => {
    const json = await apiFetch<Worker>(`/api/workers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const deleteWorker = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/workers/${id}`, { method: 'DELETE' })
    if (json.success) refresh()
    return json
  }, [refresh])

  return { workers, total, loading, q, setQ, status, setStatus, page, setPage, refresh, createWorker, updateWorker, deleteWorker }
}
