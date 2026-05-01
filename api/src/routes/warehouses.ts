import { Hono } from 'hono'
import { requireAuth, getAccessibleWarehouseIds, type Env } from '../auth/rbac'

const warehousesRouter = new Hono<{ Bindings: Env }>()

// GET /api/warehouses — list warehouses the current user can access, joined with country.
warehousesRouter.get('/', requireAuth(), async (c) => {
  const user = c.get('user')
  const allowed = await getAccessibleWarehouseIds(c.env.DB, user)

  let sql = `
    SELECT w.id, w.code, w.name, w.country_code, w.active,
           c.currency, c.locale, c.name AS country_name
      FROM warehouses w
      JOIN countries c ON c.code = w.country_code
     WHERE w.active = 1
  `
  const params: unknown[] = []

  if (allowed !== '*') {
    if (allowed.length === 0) {
      return c.json({ success: true, data: [] })
    }
    sql += ` AND w.id IN (${allowed.map(() => '?').join(',')})`
    params.push(...allowed)
  }

  // Country admins / supervisors are also scoped by country.
  if (user.country_scope !== '*') {
    sql += ` AND w.country_code = ?`
    params.push(user.country_scope)
  }

  sql += ` ORDER BY w.country_code, w.code`

  const { results } = await c.env.DB.prepare(sql).bind(...params).all<Record<string, unknown>>()

  // Map currency → symbol for frontend display.
  const symbol: Record<string, string> = { THB: '฿', VND: '₫', PHP: '₱', USD: '$' }
  const data = (results ?? []).map(r => ({
    id: r.id,
    code: r.code,
    name: r.name,
    countryCode: r.country_code,
    countryName: r.country_name,
    currency: r.currency,
    currencySymbol: symbol[String(r.currency)] ?? '',
    locale: r.locale,
  }))

  return c.json({ success: true, data })
})

export { warehousesRouter }
