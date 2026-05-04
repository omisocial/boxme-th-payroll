import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { resolveProfile } from '../auth/index'
import { requireAuth, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'
import { getSupabase } from '../db/supabase'

const authRouter = new Hono<{ Bindings: Env }>()

const changePwSchema = z.object({
  newPassword: z.string().min(8),
})

authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!token) return c.json({ success: false, message: 'Unauthorized' }, 401)

  const sb = getSupabase(c.env)
  const { data: { user: authUser }, error } = await sb.auth.getUser(token)
  if (error || !authUser) return c.json({ success: false, message: 'Unauthorized' }, 401)

  const profile = await resolveProfile(sb, authUser.id)
  if (!profile) return c.json({ success: false, message: 'Unauthorized' }, 401)

  return c.json({ success: true, data: { user: profile } })
})

authRouter.post('/change-password', requireAuth(), zValidator('json', changePwSchema), async (c) => {
  const user = c.get('user')
  const sb = getSupabase(c.env)

  await sb.from('users')
    .update({
      force_password_change: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  await appendAuditLog(sb, {
    user_id: user.id,
    user_email: user.email,
    action: 'change_password',
    entity: 'user',
    entity_id: user.id,
  })

  return c.json({ success: true, message: 'Password changed' })
})

export { authRouter }
