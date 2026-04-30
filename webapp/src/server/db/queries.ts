import type { SB } from './supabase'

export async function resolveRateConfig(
  sb: SB,
  country: string,
  dept: string | null,
  date: string
): Promise<{ base_daily: number; ot_multiplier: number } | null> {
  // Try dept-specific rate first
  if (dept) {
    const { data } = await sb.from('rate_configs')
      .select('base_daily, ot_multiplier')
      .eq('country_code', country)
      .eq('department_code', dept)
      .lte('effective_from', date)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) return data as { base_daily: number; ot_multiplier: number }
  }

  // Fallback to country-wide rate
  const { data } = await sb.from('rate_configs')
    .select('base_daily, ot_multiplier')
    .eq('country_code', country)
    .is('department_code', null)
    .lte('effective_from', date)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as { base_daily: number; ot_multiplier: number } | null
}

export async function appendAuditLog(
  sb: SB,
  entry: {
    user_id?: string
    user_email?: string
    action: string
    entity: string
    entity_id?: string
    country_code?: string
    before?: unknown
    after?: unknown
    ip?: string
  }
): Promise<void> {
  await sb.from('audit_log').insert({
    user_id: entry.user_id ?? null,
    user_email: entry.user_email ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entity_id ?? null,
    country_code: entry.country_code ?? null,
    before_json: entry.before ?? null,
    after_json: entry.after ?? null,
    ip: entry.ip ?? null,
  })
}
