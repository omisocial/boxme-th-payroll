import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { loginUser, logoutUser, resolveSession, changePassword } from '../auth/index'
import { setSessionCookie, clearSessionCookie, getSessionToken, requireAuth, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'
import { getSupabase } from '../db/supabase'
import { randomBytes } from 'node:crypto'

const authRouter = new Hono<{ Bindings: Env }>()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const changePwSchema = z.object({
  newPassword: z.string().min(8),
})

const forgotSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
})

authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')
  const ua = c.req.header('user-agent')
  const sb = getSupabase(c.env)

  const result = await loginUser(sb, email, password, ip, ua)
  if (!result) {
    return c.json({ success: false, message: 'Invalid email or password' }, 401)
  }

  setSessionCookie(c as never, result.token)
  await appendAuditLog(sb, {
    user_id: result.user.id,
    user_email: result.user.email,
    action: 'login',
    entity: 'session',
    ip,
  })

  return c.json({ success: true, data: { user: result.user } })
})

authRouter.post('/logout', async (c) => {
  const token = getSessionToken(c as never)
  const sb = getSupabase(c.env)
  if (token) await logoutUser(sb, token)
  clearSessionCookie(c as never)
  return c.json({ success: true })
})

authRouter.get('/me', async (c) => {
  const token = getSessionToken(c as never)
  const sb = getSupabase(c.env)
  const user = await resolveSession(sb, token)
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)
  return c.json({ success: true, data: { user } })
})

authRouter.post('/change-password', requireAuth(), zValidator('json', changePwSchema), async (c) => {
  const token = getSessionToken(c as never)
  const sb = getSupabase(c.env)
  const user = await resolveSession(sb, token)
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)

  const { newPassword } = c.req.valid('json')
  await changePassword(sb, user.id, newPassword)
  return c.json({ success: true, message: 'Password changed' })
})

authRouter.post('/forgot', zValidator('json', forgotSchema), async (c) => {
  const { email } = c.req.valid('json')
  const sb = getSupabase(c.env)

  const { data: userRow } = await sb.from('users')
    .select('id')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle()

  if (!userRow) {
    return c.json({ success: true, message: 'If the email exists, a reset link has been sent.' })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
  const u = userRow as Record<string, unknown>

  await sb.from('reset_tokens').insert({
    token,
    user_id: u['id'],
    expires_at: expiresAt,
  })

  const resetUrl = `${c.env.APP_URL}/reset-password?token=${token}`
  const resendKey = c.env.RESEND_API_KEY

  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@boxme.tech',
        to: email,
        subject: 'Boxme Payroll — Reset Password',
        html: `<p>Click the link below to reset your password (valid 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      }),
    })
  } else {
    console.log(`[DEV] Reset token for ${email}: ${token}`)
    console.log(`[DEV] Reset URL: ${resetUrl}`)
  }

  return c.json({ success: true, message: 'If the email exists, a reset link has been sent.' })
})

authRouter.post('/reset', zValidator('json', resetSchema), async (c) => {
  const { token, newPassword } = c.req.valid('json')
  const sb = getSupabase(c.env)

  const { data: row } = await sb.from('reset_tokens')
    .select('user_id')
    .eq('token', token)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!row) {
    return c.json({ success: false, message: 'Invalid or expired reset token' }, 400)
  }

  const r = row as Record<string, unknown>
  await changePassword(sb, r['user_id'] as string, newPassword)
  await sb.from('reset_tokens').update({ used: true }).eq('token', token)

  return c.json({ success: true, message: 'Password reset successfully' })
})

export { authRouter }
