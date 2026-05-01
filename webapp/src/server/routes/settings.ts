import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { getSupabase } from '../db/supabase'

const settingsRouter = new Hono<{ Bindings: Env }>()

// ─── Warehouses ────────────────────────────────────────────

settingsRouter.get('/warehouses', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope

  const { data, error } = await sb.from('warehouses')
    .select('*')
    .eq('country_code', country)
    .order('name')

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const warehouseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
})

settingsRouter.post('/warehouses', ...guard('country_admin'), zValidator('json', warehouseSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')

  const { data, error } = await sb.from('warehouses')
    .insert({ country_code: country, code: body.code, name: body.name })
    .select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data }, 201)
})

settingsRouter.patch('/warehouses/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const body = await c.req.json<{ name?: string; code?: string; active?: boolean }>()
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData['name'] = body.name
  if (body.code !== undefined) updateData['code'] = body.code
  if (body.active !== undefined) updateData['active'] = body.active

  const { data, error } = await sb.from('warehouses')
    .update(updateData)
    .eq('id', c.req.param('id'))
    .select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data })
})

settingsRouter.delete('/warehouses/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const { error } = await sb.from('warehouses').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true })
})

// ─── Departments ───────────────────────────────────────────

settingsRouter.get('/departments', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope

  const { data, error } = await sb.from('departments')
    .select('*')
    .eq('country_code', country)
    .order('code')

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const departmentSchema = z.object({
  code: z.string().min(1),
  name_local: z.string().min(1),
  name_en: z.string().optional(),
})

settingsRouter.post('/departments', ...guard('country_admin'), zValidator('json', departmentSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')

  const { data, error } = await sb.from('departments')
    .insert({ country_code: country, code: body.code, name_local: body.name_local, name_en: body.name_en ?? null })
    .select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data }, 201)
})

settingsRouter.patch('/departments/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const body = await c.req.json<{ code?: string; name_local?: string; name_en?: string; active?: boolean }>()
  const updateData: Record<string, unknown> = {}
  if (body.code !== undefined) updateData['code'] = body.code
  if (body.name_local !== undefined) updateData['name_local'] = body.name_local
  if (body.name_en !== undefined) updateData['name_en'] = body.name_en
  if (body.active !== undefined) updateData['active'] = body.active

  const { data, error } = await sb.from('departments')
    .update(updateData).eq('id', c.req.param('id')).select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data })
})

settingsRouter.delete('/departments/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const { error } = await sb.from('departments').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true })
})

// ─── Shifts ────────────────────────────────────────────────

settingsRouter.get('/shifts', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope

  const { data, error } = await sb.from('shifts')
    .select('*')
    .eq('country_code', country)
    .order('code')

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const shiftSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  time_range: z.string().min(1),
  is_overnight: z.boolean().default(false),
})

settingsRouter.post('/shifts', ...guard('country_admin'), zValidator('json', shiftSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')

  const { data, error } = await sb.from('shifts')
    .insert({ country_code: country, ...body })
    .select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data }, 201)
})

settingsRouter.patch('/shifts/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const body = await c.req.json<{ code?: string; name?: string; time_range?: string; is_overnight?: boolean; active?: boolean }>()
  const allowed = ['code', 'name', 'time_range', 'is_overnight', 'active'] as const
  const updateData: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) updateData[k] = body[k]
  }

  const { data, error } = await sb.from('shifts')
    .update(updateData).eq('id', c.req.param('id')).select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data })
})

settingsRouter.delete('/shifts/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const { error } = await sb.from('shifts').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true })
})

// ─── Legal Limits ──────────────────────────────────────────

settingsRouter.get('/legal-limits', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')

  let query = sb.from('legal_limits').select('*')
  if (user.country_scope !== '*') query = query.eq('country_code', user.country_scope)

  const { data, error } = await query.order('country_code')
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const legalLimitSchema = z.object({
  max_daily_hours: z.number().positive(),
  max_weekly_hours: z.number().positive(),
  max_consecutive_days: z.number().int().positive(),
  ot_threshold_daily: z.number().positive(),
})

settingsRouter.patch('/legal-limits/:country', ...guard('country_admin'), zValidator('json', legalLimitSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = c.req.param('country')

  if (user.country_scope !== '*' && user.country_scope !== country) {
    return c.json({ success: false, message: 'Forbidden: wrong country' }, 403)
  }

  const body = c.req.valid('json')
  const { data, error } = await sb.from('legal_limits')
    .upsert({ country_code: country, ...body, updated_at: new Date().toISOString() }, { onConflict: 'country_code' })
    .select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data })
})

// ─── Pay Components ────────────────────────────────────────

settingsRouter.get('/pay-components', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope

  const { data, error } = await sb.from('pay_components')
    .select('*')
    .eq('country_code', country)
    .order('applies_to')
    .order('code')

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const payComponentSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  formula_type: z.enum(['fixed', 'per_hour', 'multiplier', 'expression']),
  formula_value: z.string(),
  applies_to: z.enum(['gross', 'deduction']),
  effective_from: z.string(),
})

settingsRouter.post('/pay-components', ...guard('country_admin'), zValidator('json', payComponentSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const country = user.country_scope === '*' ? (c.req.query('country') ?? 'TH') : user.country_scope
  const body = c.req.valid('json')

  const { data, error } = await sb.from('pay_components')
    .insert({ country_code: country, ...body })
    .select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data }, 201)
})

settingsRouter.patch('/pay-components/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const body = await c.req.json<Record<string, unknown>>()
  const allowed = ['name', 'formula_type', 'formula_value', 'applies_to', 'active', 'effective_from']
  const updateData: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updateData[k] = v
  }

  const { data, error } = await sb.from('pay_components')
    .update(updateData).eq('id', c.req.param('id')).select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data })
})

settingsRouter.delete('/pay-components/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  // Soft delete — set active = false
  const { data, error } = await sb.from('pay_components')
    .update({ active: false })
    .eq('id', c.req.param('id'))
    .select().single()

  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data })
})

// ─── Pay Rules ─────────────────────────────────────────────

settingsRouter.get('/pay-rules', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const componentId = c.req.query('component_id')

  let query = sb.from('pay_rules').select('*').order('priority', { ascending: false })
  if (componentId) query = query.eq('component_id', componentId)

  const { data, error } = await query
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const payRuleSchema = z.object({
  component_id: z.string().uuid(),
  condition_field: z.enum(['department_code', 'shift_code', 'job_type_code', 'day_type']),
  condition_op: z.enum(['=', 'IN', '!=']),
  condition_value: z.string().min(1),
  priority: z.number().int().default(0),
})

settingsRouter.post('/pay-rules', ...guard('country_admin'), zValidator('json', payRuleSchema), async (c) => {
  const sb = getSupabase(c.env)
  const body = c.req.valid('json')

  const { data, error } = await sb.from('pay_rules').insert(body).select().single()
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data }, 201)
})

settingsRouter.delete('/pay-rules/:id', ...guard('country_admin'), async (c) => {
  const sb = getSupabase(c.env)
  const { error } = await sb.from('pay_rules').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true })
})

export { settingsRouter }
