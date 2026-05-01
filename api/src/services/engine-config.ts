// Engine config loader. Resolution rules:
// 1. Most specific match: country + warehouse_id (effective_from <= today, latest)
// 2. Country-default: country + warehouse_id IS NULL
// 3. Hardcoded fallback (mirrors webapp DEFAULT_ENGINE_CONFIG for TH).

export interface EngineConfigRow {
  id: string
  country_code: string
  warehouse_id: string | null
  effective_from: string
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
  formula_overrides: Record<string, unknown>
}

const KEYWORD_FIELDS = [
  'paid_leave_keywords',
  'bm_prefixes',
  'dw_prefixes',
  'intern_keywords',
  'housekeeper_keywords',
  'sick_leave_keywords',
  'personal_leave_keywords',
  'manual_checkin_keywords',
] as const

function parseRow(row: Record<string, unknown>): EngineConfigRow {
  const parsed: Record<string, unknown> = { ...row }
  for (const f of KEYWORD_FIELDS) {
    try { parsed[f] = JSON.parse(String(row[f] ?? '[]')) } catch { parsed[f] = [] }
  }
  try { parsed['formula_overrides'] = JSON.parse(String(row['formula_overrides'] ?? '{}')) }
  catch { parsed['formula_overrides'] = {} }
  return parsed as unknown as EngineConfigRow
}

export async function loadEngineConfig(
  db: D1Database,
  countryCode: string,
  warehouseId: string | null,
): Promise<EngineConfigRow | null> {
  const today = new Date().toISOString().slice(0, 10)

  if (warehouseId) {
    const wh = await db.prepare(`
      SELECT * FROM payroll_engine_configs
       WHERE country_code = ? AND warehouse_id = ? AND effective_from <= ?
       ORDER BY effective_from DESC LIMIT 1
    `).bind(countryCode, warehouseId, today).first<Record<string, unknown>>()
    if (wh) return parseRow(wh)
  }

  const country = await db.prepare(`
    SELECT * FROM payroll_engine_configs
     WHERE country_code = ? AND warehouse_id IS NULL AND effective_from <= ?
     ORDER BY effective_from DESC LIMIT 1
  `).bind(countryCode, today).first<Record<string, unknown>>()
  return country ? parseRow(country) : null
}
