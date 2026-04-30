import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { getSupabase } from '../db/supabase'
import { appendAuditLog } from '../db/queries'
import { randomBytes, createHash } from 'node:crypto'

const adminRouter = new Hono<{ Bindings: Env }>()

// GET /api/admin/users
adminRouter.get('/users', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = c.req.query('country')

  let query = sb.from('users')
    .select('id, email, role, country_scope, warehouse_id, status, created_at, last_login_at')
    .is('deleted_at', null)
    .order('email')

  if (user.role !== 'super_admin') {
    query = query.eq('country_scope', user.country_scope)
  } else if (country) {
    query = query.eq('country_scope', country)
  }

  const { data, error } = await query
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['super_admin', 'country_admin', 'hr', 'supervisor', 'viewer']),
  countryScope: z.string().default('TH'),
  warehouseId: z.string().uuid().optional(),
})

// POST /api/admin/users
adminRouter.post('/users', ...guard('country_admin'), zValidator('json', createUserSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const body = c.req.valid('json')

  if (user.role !== 'super_admin' && body.countryScope !== user.country_scope) {
    return c.json({ success: false, message: 'Cannot create user for different country' }, 403)
  }

  // Generate temporary password
  const tempPassword = randomBytes(12).toString('base64').replace(/[+/=]/g, '').slice(0, 16)
  const hash = createHash('sha256').update(tempPassword).digest('hex')
  const passwordHash = `$seed$sha256$${hash}`

  const { data: created, error } = await sb.from('users').insert({
    email: body.email,
    role: body.role,
    country_scope: body.countryScope,
    warehouse_id: body.warehouseId ?? null,
    password_hash: passwordHash,
    force_password_change: true,
    status: 'active',
  }).select('id, email, role, country_scope').single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'create_user', entity: 'user',
    entity_id: (created as Record<string, unknown>)['id'] as string,
    after: { email: body.email, role: body.role },
  })

  return c.json({ success: true, data: { ...created, tempPassword } }, 201)
})

const updateUserSchema = z.object({
  role: z.enum(['super_admin', 'country_admin', 'hr', 'supervisor', 'viewer']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  countryScope: z.string().optional(),
  warehouseId: z.string().uuid().optional().nullable(),
})

// PATCH /api/admin/users/:id
adminRouter.patch('/users/:id', ...guard('country_admin'), zValidator('json', updateUserSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const id = c.req.param('id')
  const body = c.req.valid('json')

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.role !== undefined) updateData['role'] = body.role
  if (body.status !== undefined) updateData['status'] = body.status
  if (body.countryScope !== undefined) updateData['country_scope'] = body.countryScope
  if ('warehouseId' in body) updateData['warehouse_id'] = body.warehouseId

  const { data: updated, error } = await sb.from('users')
    .update(updateData)
    .eq('id', id)
    .select('id, email, role, country_scope, status')
    .single()

  if (error) return c.json({ success: false, message: error.message }, 500)

  await appendAuditLog(sb, {
    user_id: user.id, user_email: user.email,
    action: 'update_user', entity: 'user', entity_id: id, after: body,
  })

  return c.json({ success: true, data: updated })
})

// GET /api/admin/rate-configs
adminRouter.get('/rate-configs', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope

  const { data, error } = await sb.from('rate_configs')
    .select('*')
    .eq('country_code', country)
    .order('effective_from', { ascending: false })

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const rateConfigSchema = z.object({
  country: z.string(),
  department: z.string().optional(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  baseDailyThb: z.number().positive(),
  otMultiplier: z.number().positive().default(1.5),
  mealAllowanceThb: z.number().default(0),
})

// POST /api/admin/rate-configs
adminRouter.post('/rate-configs', ...guard('country_admin'), zValidator('json', rateConfigSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const body = c.req.valid('json')

  const { data: created, error } = await sb.from('rate_configs').insert({
    country_code: body.country,
    department: body.department ?? null,
    effective_from: body.effectiveFrom,
    effective_to: body.effectiveTo ?? null,
    base_daily: body.baseDailyThb,
    ot_multiplier: body.otMultiplier,
    meal_allowance: body.mealAllowanceThb,
    created_by: user.email,
  }).select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: created }, 201)
})

// DELETE /api/admin/rate-configs/:id
adminRouter.delete('/rate-configs/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const { error } = await sb.from('rate_configs').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true })
})

export { adminRouter }
