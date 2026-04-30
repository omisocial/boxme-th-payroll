import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { loginUser, logoutUser, resolveSession, changePassword } from '../auth/index'
import { setSessionCookie, clearSessionCookie, getSessionToken, requireAuth, type Env } from '../auth/rbac'
import { appendAuditLog } from '../db/queries'
import { randomBytes, createHash } from 'node:crypto'

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

  const result = await loginUser(c.env.DB, email, password, ip, ua)
  if (!result) {
    return c.json({ success: false, message: 'Invalid email or password' }, 401)
  }

  setSessionCookie(c, result.token)
  await appendAuditLog(c.env.DB, {
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
  if (token) await logoutUser(c.env.DB, token)
  clearSessionCookie(c as never)
  return c.json({ success: true })
})

authRouter.get('/me', async (c) => {
  const token = getSessionToken(c as never)
  const user = await resolveSession(c.env.DB, token)
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)
  return c.json({ success: true, data: { user } })
})

authRouter.post('/change-password', zValidator('json', changePwSchema), async (c) => {
  const token = getSessionToken(c as never)
  const user = await resolveSession(c.env.DB, token)
  if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401)

  const { newPassword } = c.req.valid('json')
  await changePassword(c.env.DB, user.id, newPassword)
  return c.json({ success: true, message: 'Password changed' })
})

authRouter.post('/forgot', zValidator('json', forgotSchema), async (c) => {
  const { email } = c.req.valid('json')

  const userRow = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? AND active = 1')
    .bind(email).first<{ id: string }>()

  if (!userRow) {
    // Always 200 to avoid email enumeration
    return c.json({ success: true, message: 'If the email exists, a reset link has been sent.' })
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString().replace('T', ' ').split('.')[0]

  await c.env.DB.prepare(`
    INSERT INTO reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)
  `).bind(token, userRow.id, expiresAt).run()

  const resetUrl = `https://payroll.boxme.tech/reset-password?token=${token}`

  const resendKey = (c.env as unknown as Record<string, string>)['RESEND_API_KEY']
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
    // Dev mode: log token to console
    console.log(`[DEV] Reset token for ${email}: ${token}`)
    console.log(`[DEV] Reset URL: ${resetUrl}`)
  }

  return c.json({ success: true, message: 'If the email exists, a reset link has been sent.' })
})

authRouter.post('/reset', zValidator('json', resetSchema), async (c) => {
  const { token, newPassword } = c.req.valid('json')

  const row = await c.env.DB.prepare(`
    SELECT user_id FROM reset_tokens
    WHERE token = ? AND expires_at > datetime('now') AND used = 0
  `).bind(token).first<{ user_id: string }>()

  if (!row) {
    return c.json({ success: false, message: 'Invalid or expired reset token' }, 400)
  }

  await changePassword(c.env.DB, row.user_id, newPassword)
  await c.env.DB.prepare('UPDATE reset_tokens SET used = 1 WHERE token = ?').bind(token).run()

  return c.json({ success: true, message: 'Password reset successfully' })
})

export { authRouter }
