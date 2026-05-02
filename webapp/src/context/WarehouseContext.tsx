import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface WarehouseInfo {
  id: string
  code: string
  name: string
  countryCode: string
  countryName?: string
  currency: string
  currencySymbol: string
  locale?: string
}

interface WarehouseContextValue {
  current: WarehouseInfo | null
  accessible: WarehouseInfo[]
  loading: boolean
  error: string | null
  setCurrent: (id: string) => void
  refresh: () => void
}

const WarehouseContext = createContext<WarehouseContextValue | null>(null)

const STORAGE_KEY = 'boxme-payroll.currentWarehouseId'

const FALLBACK: WarehouseInfo = {
  id: 'a0000000-0000-0000-0000-000000000001', code: 'TH-BKK-1', name: 'Bangkhen Warehouse 1',
  countryCode: 'TH', currency: 'THB', currencySymbol: '฿',
}

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [accessible, setAccessible] = useState<WarehouseInfo[]>([FALLBACK])
  const [currentId, setCurrentId] = useState<string>(() => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return stored ?? FALLBACK.id
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/warehouses', { credentials: 'include' })
      if (res.status === 401) {
        // Not logged in yet — leave fallback in place silently.
        setLoading(false)
        return
      }
      const json = await res.json() as { success: boolean; data?: WarehouseInfo[]; message?: string }
      if (json.success && json.data && json.data.length > 0) {
        setAccessible(json.data)
        // Reconcile current selection.
        setCurrentId(prev => {
          if (json.data!.some(w => w.id === prev)) return prev
          const first = json.data![0].id
          try { localStorage.setItem(STORAGE_KEY, first) } catch { /* noop */ }
          return first
        })
      } else if (json.success) {
        // Authenticated but no warehouse access.
        setAccessible([])
        setError('No accessible warehouses')
      } else {
        setError(json.message ?? 'Failed to load warehouses')
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const setCurrent = useCallback((id: string) => {
    setCurrentId(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch { /* noop */ }
  }, [])

  const value = useMemo<WarehouseContextValue>(() => ({
    current: accessible.find(w => w.id === currentId) ?? accessible[0] ?? null,
    accessible,
    loading,
    error,
    setCurrent,
    refresh,
  }), [accessible, currentId, loading, error, setCurrent, refresh])

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>
}

export function useWarehouse(): WarehouseContextValue {
  const ctx = useContext(WarehouseContext)
  if (!ctx) throw new Error('useWarehouse must be inside WarehouseProvider')
  return ctx
}
