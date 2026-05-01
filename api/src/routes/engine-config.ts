import { Hono } from 'hono'
import { guard, type Env } from '../auth/rbac'
import { loadEngineConfig } from '../services/engine-config'

const engineConfigRouter = new Hono<{ Bindings: Env }>()

// GET /api/engine-config?warehouse_id=...&country=TH
engineConfigRouter.get('/', ...guard('viewer'), async (c) => {
  const user = c.get('user')
  const country = user.country_scope === '*'
    ? (c.req.query('country') ?? 'TH')
    : user.country_scope
  const warehouseId = c.req.query('warehouse_id') ?? null

  const cfg = await loadEngineConfig(c.env.DB, country, warehouseId)
  if (!cfg) {
    return c.json({ success: false, message: `No engine config for country=${country}` }, 404)
  }
  return c.json({ success: true, data: cfg })
})

export { engineConfigRouter }
