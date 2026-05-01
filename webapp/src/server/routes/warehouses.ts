import { Hono } from 'hono'
import { guard, type Env } from '../auth/rbac'
import { getSupabase } from '../db/supabase'

const warehousesRouter = new Hono<{ Bindings: Env }>()

const CURRENCY_SYMBOLS: Record<string, string> = {
  THB: '฿', VND: '₫', PHP: '₱', USD: '$', EUR: '€',
}

// GET /api/warehouses — list warehouses accessible to the current user.
// super_admin gets all; others get warehouses from user_warehouses join table.
warehousesRouter.get('/', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')

  let query = sb
    .from('warehouses')
    .select('id, code, name, country_code, countries(name, currency, locale)')
    .eq('active', true)
    .order('country_code')
    .order('name')

  if (user.role !== 'super_admin' && user.role !== 'country_admin') {
    const { data: uw } = await sb
      .from('user_warehouses')
      .select('warehouse_id')
      .eq('user_id', user.id)
    const ids = (uw ?? []).map((r: { warehouse_id: string }) => r.warehouse_id)
    if (ids.length === 0) return c.json({ success: true, data: [] })
    query = query.in('id', ids)
  } else if (user.country_scope !== '*') {
    query = query.eq('country_code', user.country_scope)
  }

  const { data, error } = await query
  if (error) return c.json({ success: false, message: error.message }, 500)

  const rows = (data ?? []).map((w: Record<string, unknown>) => {
    const country = w.countries as { name: string; currency: string; locale: string } | null
    const currency = country?.currency ?? 'THB'
    return {
      id: w.id,
      code: w.code,
      name: w.name,
      countryCode: w.country_code,
      countryName: country?.name ?? null,
      currency,
      currencySymbol: CURRENCY_SYMBOLS[currency] ?? currency,
      locale: country?.locale ?? 'en',
    }
  })

  return c.json({ success: true, data: rows })
})

export { warehousesRouter }
