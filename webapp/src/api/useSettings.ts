import { useState, useEffect, useCallback } from 'react'

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(path, { credentials: 'include', ...opts })
  return res.json()
}

export interface Warehouse {
  id: string
  country_code: string
  code: string
  name: string
  active: boolean
}

export interface Department {
  id: string
  country_code: string
  code: string
  name_local: string
  name_en: string | null
  active: boolean
}

export interface Shift {
  id: string
  country_code: string
  code: string
  name: string
  time_range: string
  is_overnight: boolean
  active: boolean
}

export interface LegalLimit {
  id: string
  country_code: string
  max_daily_hours: number
  max_weekly_hours: number
  max_consecutive_days: number
  ot_threshold_daily: number
  updated_at: string
}

export interface PayComponent {
  id: string
  country_code: string
  code: string
  name: string
  formula_type: 'fixed' | 'per_hour' | 'multiplier' | 'expression'
  formula_value: string
  applies_to: 'gross' | 'deduction'
  active: boolean
  effective_from: string
  created_at: string
}

export interface PayRule {
  id: string
  component_id: string
  condition_field: string
  condition_op: string
  condition_value: string
  priority: number
}

export function useWarehouses(country: string) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const json = await apiFetch<Warehouse[]>(`/api/settings/warehouses?country=${country}`)
    if (json.success && json.data) setWarehouses(json.data)
    setLoading(false)
  }, [country])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (data: { code: string; name: string }) => {
    const json = await apiFetch<Warehouse>(`/api/settings/warehouses?country=${country}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [country, refresh])

  const update = useCallback(async (id: string, data: Partial<Warehouse>) => {
    const json = await apiFetch<Warehouse>(`/api/settings/warehouses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/settings/warehouses/${id}`, { method: 'DELETE' })
    if (json.success) refresh()
    return json
  }, [refresh])

  return { warehouses, loading, refresh, create, update, remove }
}

export function useDepartments(country: string) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const json = await apiFetch<Department[]>(`/api/settings/departments?country=${country}`)
    if (json.success && json.data) setDepartments(json.data)
    setLoading(false)
  }, [country])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (data: { code: string; name_local: string; name_en?: string }) => {
    const json = await apiFetch<Department>(`/api/settings/departments?country=${country}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [country, refresh])

  const update = useCallback(async (id: string, data: Partial<Department>) => {
    const json = await apiFetch<Department>(`/api/settings/departments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/settings/departments/${id}`, { method: 'DELETE' })
    if (json.success) refresh()
    return json
  }, [refresh])

  return { departments, loading, refresh, create, update, remove }
}

export function useShifts(country: string) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const json = await apiFetch<Shift[]>(`/api/settings/shifts?country=${country}`)
    if (json.success && json.data) setShifts(json.data)
    setLoading(false)
  }, [country])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (data: { code: string; name: string; time_range: string; is_overnight: boolean }) => {
    const json = await apiFetch<Shift>(`/api/settings/shifts?country=${country}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [country, refresh])

  const update = useCallback(async (id: string, data: Partial<Shift>) => {
    const json = await apiFetch<Shift>(`/api/settings/shifts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/settings/shifts/${id}`, { method: 'DELETE' })
    if (json.success) refresh()
    return json
  }, [refresh])

  return { shifts, loading, refresh, create, update, remove }
}

export function useLegalLimits(country: string) {
  const [limits, setLimits] = useState<LegalLimit[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const json = await apiFetch<LegalLimit[]>(`/api/settings/legal-limits?country=${country}`)
    if (json.success && json.data) setLimits(json.data)
    setLoading(false)
  }, [country])

  useEffect(() => { refresh() }, [refresh])

  const save = useCallback(async (countryCode: string, data: Omit<LegalLimit, 'id' | 'country_code' | 'updated_at'>) => {
    const json = await apiFetch<LegalLimit>(`/api/settings/legal-limits/${countryCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  return { limits, loading, refresh, save }
}

export function usePayComponents(country: string) {
  const [components, setComponents] = useState<PayComponent[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const json = await apiFetch<PayComponent[]>(`/api/settings/pay-components?country=${country}`)
    if (json.success && json.data) setComponents(json.data)
    setLoading(false)
  }, [country])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (data: Omit<PayComponent, 'id' | 'country_code' | 'created_at'>) => {
    const json = await apiFetch<PayComponent>(`/api/settings/pay-components?country=${country}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [country, refresh])

  const update = useCallback(async (id: string, data: Partial<PayComponent>) => {
    const json = await apiFetch<PayComponent>(`/api/settings/pay-components/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/settings/pay-components/${id}`, { method: 'DELETE' })
    if (json.success) refresh()
    return json
  }, [refresh])

  return { components, loading, refresh, create, update, remove }
}

export function usePayRules(componentId?: string) {
  const [rules, setRules] = useState<PayRule[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const params = componentId ? `?component_id=${componentId}` : ''
    const json = await apiFetch<PayRule[]>(`/api/settings/pay-rules${params}`)
    if (json.success && json.data) setRules(json.data)
    setLoading(false)
  }, [componentId])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (data: Omit<PayRule, 'id'>) => {
    const json = await apiFetch<PayRule>('/api/settings/pay-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (json.success) refresh()
    return json
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    const json = await apiFetch(`/api/settings/pay-rules/${id}`, { method: 'DELETE' })
    if (json.success) refresh()
    return json
  }, [refresh])

  return { rules, loading, refresh, create, remove }
}
