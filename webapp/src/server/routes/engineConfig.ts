import { Hono } from 'hono'
import { guard, type Env } from '../auth/rbac'
import { getSupabase } from '../db/supabase'

const engineConfigRouter = new Hono<{ Bindings: Env }>()

// GET /api/engine-config?country=TH&warehouse_id=<uuid>
// Resolution order: warehouse-specific → country-default → null (fallback in client)
engineConfigRouter.get('/', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*'
    ? (c.req.query('country') ?? 'TH')
    : user.country_scope
  const warehouseId = c.req.query('warehouse_id') ?? null
  const today = new Date().toISOString().slice(0, 10)

  // Try warehouse-specific first
  if (warehouseId) {
    const { data: whCfg } = await sb
      .from('payroll_engine_configs')
      .select('*')
      .eq('country_code', country)
      .eq('warehouse_id', warehouseId)
      .lte('effective_from', today)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (whCfg) return c.json({ success: true, data: whCfg })
  }

  // Fall back to country default
  const { data: countryCfg, error } = await sb
    .from('payroll_engine_configs')
    .select('*')
    .eq('country_code', country)
    .is('warehouse_id', null)
    .lte('effective_from', today)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return c.json({ success: false, message: error.message }, 500)
  if (!countryCfg) return c.json({ success: false, message: 'No engine config found' }, 404)

  return c.json({ success: true, data: countryCfg })
})

export { engineConfigRouter }
