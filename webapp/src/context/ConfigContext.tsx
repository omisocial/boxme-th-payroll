import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_ENGINE_CONFIG, type EngineConfig } from '../payroll/types'
import { useWarehouse } from './WarehouseContext'

interface ConfigContextValue {
  config: EngineConfig
  loading: boolean
  error: string | null
  setConfig: (next: EngineConfig) => void
  reload: () => void
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

interface ApiCfg {
  country_code: string
  warehouse_id: string | null
  default_daily_rate: number
  ot_multiplier: number
  late_buffer_minutes: number
  late_rounding_unit: number
  paid_leave_keywords: string[]
  bm_prefixes: string[]
  dw_prefixes: string[]
  intern_keywords: string[]
  housekeeper_keywords: string[]
  sick_leave_keywords: string[]
  personal_leave_keywords: string[]
  manual_checkin_keywords: string[]
}

function fromApi(cfg: ApiCfg, currency: string, currencySymbol: string): EngineConfig {
  return {
    countryCode: cfg.country_code,
    warehouseId: cfg.warehouse_id,
    currency,
    currencySymbol,
    defaultDailyRate: cfg.default_daily_rate,
    otMultiplier: cfg.ot_multiplier,
    lateBufferMinutes: cfg.late_buffer_minutes,
    lateRoundingUnit: cfg.late_rounding_unit,
    paidLeaveClassifications: cfg.paid_leave_keywords ?? [],
    bmPrefixes: cfg.bm_prefixes ?? [],
    dwPrefixes: cfg.dw_prefixes ?? [],
    internKeywords: cfg.intern_keywords ?? [],
    housekeeperKeywords: cfg.housekeeper_keywords ?? [],
    sickLeaveKeywords: cfg.sick_leave_keywords ?? [],
    personalLeaveKeywords: cfg.personal_leave_keywords ?? [],
    manualCheckinKeywords: cfg.manual_checkin_keywords ?? [],
  }
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { current } = useWarehouse()

  const fallback = useMemo<EngineConfig>(() => ({
    ...DEFAULT_ENGINE_CONFIG,
    countryCode: current?.countryCode ?? DEFAULT_ENGINE_CONFIG.countryCode,
    warehouseId: current?.id ?? null,
    currency: current?.currency ?? DEFAULT_ENGINE_CONFIG.currency,
    currencySymbol: current?.currencySymbol ?? DEFAULT_ENGINE_CONFIG.currencySymbol,
  }), [current])

  const [config, setConfigState] = useState<EngineConfig>(fallback)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!current) { setConfigState(fallback); return }
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        country: current.countryCode,
        warehouse_id: current.id,
      })
      const res = await fetch(`/api/engine-config?${params}`, { credentials: 'include' })
      if (res.status === 401 || res.status === 404) {
        // Not logged in or no config yet — keep fallback.
        setConfigState(fallback)
        return
      }
      const json = await res.json() as { success: boolean; data?: ApiCfg; message?: string }
      if (json.success && json.data) {
        setConfigState(fromApi(json.data, current.currency, current.currencySymbol))
      } else {
        setError(json.message ?? 'Failed to load engine config')
        setConfigState(fallback)
      }
    } catch (e) {
      setError((e as Error).message)
      setConfigState(fallback)
    } finally {
      setLoading(false)
    }
  }, [current, fallback])

  useEffect(() => { reload() }, [reload])

  const setConfig = useCallback((next: EngineConfig) => setConfigState(next), [])

  const value = useMemo<ConfigContextValue>(() => ({
    config, loading, error, setConfig, reload,
  }), [config, loading, error, setConfig, reload])

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useEngineConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useEngineConfig must be inside ConfigProvider')
  return ctx
}
