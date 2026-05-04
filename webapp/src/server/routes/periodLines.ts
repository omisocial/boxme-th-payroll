import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { guard, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'
import { getSupabase } from '../db/supabase'

const periodLinesRouter = new Hono<{ Bindings: Env }>()

import type { SB } from '../db/supabase'
import type { AuthUser } from '../auth'

// Verify the user is allowed to access the given period. Returns { ok: true } or
// { ok: false, status, message } so the caller can early-return the response.
async function assertPeriodScope(sb: SB, periodId: string, user: AuthUser):
  Promise<{ ok: true } | { ok: false; status: 403 | 404; message: string }> {
  const { data, error } = await sb.from('payroll_periods')
    .select('id, country_code, warehouse_id')
    .eq('id', periodId)
    .maybeSingle()
  if (error) return { ok: false, status: 404, message: error.message }
  if (!data) return { ok: false, status: 404, message: 'Period not found' }
  const p = data as { country_code: string; warehouse_id: string | null }
  if (user.country_scope !== '*' && p.country_code !== user.country_scope) {
    return { ok: false, status: 403, message: 'Forbidden: country scope' }
  }
  if (user.warehouse_id && p.warehouse_id && p.warehouse_id !== user.warehouse_id) {
    return { ok: false, status: 403, message: 'Forbidden: warehouse scope' }
  }
  return { ok: true }
}

// GET /api/period-lines?period_id=X[&payment_status=unpaid|paid][&q=]
periodLinesRouter.get('/', ...guard('viewer'), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const periodId = c.req.query('period_id')
  const paymentStatus = c.req.query('payment_status')
  const q = c.req.query('q')

  if (!periodId) {
    return c.json({ success: false, message: 'period_id is required' }, 400)
  }

  const scope = await assertPeriodScope(sb, periodId, user)
  if (!scope.ok) return c.json({ success: false, message: scope.message }, scope.status)

  let query = sb.from('payroll_period_lines')
    .select('*, workers(id, code, name_local, job_type_code, department_code)')
    .eq('period_id', periodId)
    .order('full_name')

  if (paymentStatus === 'unpaid' || paymentStatus === 'paid') {
    query = query.eq('payment_status', paymentStatus)
  }
  if (q) {
    const safeQ = q.replace(/[\\%_]/g, m => '\\' + m)
    query = query.ilike('full_name', `%${safeQ}%`)
  }

  const { data, error } = await query
  if (error) return c.json({ success: false, message: error.message }, 500)
  return c.json({ success: true, data: data ?? [] })
})

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
  paymentStatus: z.enum(['unpaid', 'paid']),
  note: z.string().optional(),
})

// PATCH /api/period-lines/bulk-status
periodLinesRouter.patch('/bulk-status', ...guard('hr'), zValidator('json', bulkSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const { ids, paymentStatus, note } = c.req.valid('json')

  // Verify ALL ids belong to periods the user can access
  const { data: targets, error: tErr } = await sb.from('payroll_period_lines')
    .select('id, period_id')
    .in('id', ids)
  if (tErr) return c.json({ success: false, message: tErr.message }, 500)
  if (!targets || targets.length !== ids.length) {
    return c.json({ success: false, message: 'Some lines not found' }, 404)
  }
  const periodIds = Array.from(new Set((targets as Array<{ period_id: string }>).map(t => t.period_id)))
  for (const pid of periodIds) {
    const scope = await assertPeriodScope(sb, pid, user)
    if (!scope.ok) return c.json({ success: false, message: scope.message }, scope.status)
  }

  const update: Record<string, unknown> = {
    payment_status: paymentStatus,
    paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
    paid_by: paymentStatus === 'paid' ? user.email : null,
    payment_note: note ?? null,
  }

  const { data, error } = await sb.from('payroll_period_lines')
    .update(update)
    .in('id', ids)
    .select('id, payment_status')

  if (error) return c.json({ success: false, message: error.message }, 500)

  await appendAuditLog(sb, {
    user_id: user.id,
    user_email: user.email,
    action: 'update_payment_status',
    entity: 'payroll_period_lines',
    entity_id: ids.join(','),
    after: { paymentStatus, count: ids.length, note },
  })

  return c.json({ success: true, data: data ?? [], message: `${(data ?? []).length} updated` })
})

const oneSchema = z.object({
  paymentStatus: z.enum(['unpaid', 'paid']),
  note: z.string().optional(),
})

// PATCH /api/period-lines/:id
periodLinesRouter.patch('/:id', ...guard('hr'), zValidator('json', oneSchema), async (c) => {
  const sb = getSupabase(c.env)
  const user = c.get('user')
  const id = c.req.param('id')
  const { paymentStatus, note } = c.req.valid('json')

  const { data: target, error: tErr } = await sb.from('payroll_period_lines')
    .select('period_id')
    .eq('id', id)
    .maybeSingle()
  if (tErr) return c.json({ success: false, message: tErr.message }, 500)
  if (!target) return c.json({ success: false, message: 'Not found' }, 404)
  const scope = await assertPeriodScope(sb, (target as { period_id: string }).period_id, user)
  if (!scope.ok) return c.json({ success: false, message: scope.message }, scope.status)

  const update: Record<string, unknown> = {
    payment_status: paymentStatus,
    paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
    paid_by: paymentStatus === 'paid' ? user.email : null,
    payment_note: note ?? null,
  }

  const { data, error } = await sb.from('payroll_period_lines')
    .update(update)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) return c.json({ success: false, message: error.message }, 500)

  await appendAuditLog(sb, {
    user_id: user.id,
    user_email: user.email,
    action: 'update_payment_status',
    entity: 'payroll_period_lines',
    entity_id: id,
    after: { paymentStatus, note },
  })

  return c.json({ success: true, data })
})

export { periodLinesRouter }
