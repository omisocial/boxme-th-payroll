#!/usr/bin/env tsx
/**
 * Creates or resets seed accounts in Supabase Auth using the Admin API.
 *
 * Requires environment variables:
 *   SUPABASE_URL            — your project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (never commit this)
 *
 * Load from local env file before running:
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/gen-seed-passwords.ts
 *
 * What this does:
 *   1. Creates/updates Supabase Auth users for each seed account
 *   2. Generates a fresh random password for each
 *   3. Ensures public.users profile rows exist with correct role/scope
 *   4. Writes plaintext passwords to .env.seed (gitignored)
 */

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function genPassword(length = 24): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length)
}

const accounts = [
  { key: 'ADMIN',    email: 'admin@boxme.tech',           role: 'super_admin',   scope: '*'  },
  { key: 'TH_ADMIN', email: 'th.admin@boxme.tech',        role: 'country_admin', scope: 'TH' },
  { key: 'TH_HR',    email: 'th.hr@boxme.tech',           role: 'hr',            scope: 'TH' },
  { key: 'TH_SUP',   email: 'th.supervisor@boxme.tech',   role: 'supervisor',    scope: 'TH' },
  { key: 'VN_ADMIN', email: 'vn.admin@boxme.tech',        role: 'country_admin', scope: 'VN' },
  { key: 'VN_HR',    email: 'vn.hr@boxme.tech',           role: 'hr',            scope: 'VN' },
  { key: 'VN_SUP',   email: 'vn.supervisor@boxme.tech',   role: 'supervisor',    scope: 'VN' },
  { key: 'PH_ADMIN', email: 'ph.admin@boxme.tech',        role: 'country_admin', scope: 'PH' },
  { key: 'PH_HR',    email: 'ph.hr@boxme.tech',           role: 'hr',            scope: 'PH' },
  { key: 'PH_SUP',   email: 'ph.supervisor@boxme.tech',   role: 'supervisor',    scope: 'PH' },
  { key: 'VIEWER',   email: 'viewer@boxme.tech',          role: 'viewer',        scope: '*'  },
]

const passwords: Record<string, string> = {}

async function run() {
  console.log('\n🔐 Boxme Payroll — Seed Account Setup (Supabase Auth)\n')

  for (const acc of accounts) {
    const pw = genPassword()
    passwords[acc.key] = pw

    // Create or update the Supabase Auth user
    const { data: existing } = await sb.auth.admin.listUsers()
    const existingUser = existing?.users.find(u => u.email === acc.email)

    let userId: string

    if (existingUser) {
      const { data, error } = await sb.auth.admin.updateUserById(existingUser.id, {
        password: pw,
        email_confirm: true,
      })
      if (error) { console.error(`❌  ${acc.email}: ${error.message}`); continue }
      userId = data.user.id
      console.log(`♻️  Updated auth user: ${acc.email}`)
    } else {
      const { data, error } = await sb.auth.admin.createUser({
        email: acc.email,
        password: pw,
        email_confirm: true,
      })
      if (error) { console.error(`❌  ${acc.email}: ${error.message}`); continue }
      userId = data.user.id
      console.log(`✅  Created auth user: ${acc.email}`)
    }

    // Sync public.users profile — delete old row (may have legacy UUID) then insert fresh
    const { data: oldRow } = await sb.from('users').select('id').eq('email', acc.email).maybeSingle()
    if (oldRow && (oldRow as Record<string, unknown>)['id'] !== userId) {
      // Remove FK deps first, then the old profile row
      await sb.from('user_warehouses').delete().eq('user_id', (oldRow as Record<string, unknown>)['id'])
      await sb.from('users').delete().eq('email', acc.email)
    }

    const { error: profileError } = await sb.from('users').upsert({
      id: userId,
      email: acc.email,
      role: acc.role,
      country_scope: acc.scope,
      force_password_change: true,
      active: true,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error(`❌  Profile upsert for ${acc.email}: ${profileError.message}`)
    }
  }

  // Write .env.seed with plaintext passwords
  const envLines = accounts.map(a =>
    `SEED_PASSWORD_${a.key}=${passwords[a.key]}  # ${a.email}`
  ).join('\n')

  writeFileSync(
    resolve(ROOT, '.env.seed'),
    `# Boxme Payroll — Seed Passwords (Supabase Auth)\n# Generated: ${new Date().toISOString()}\n# Store in 1Password → Boxme > Payroll Seed Accounts\n# DO NOT COMMIT\n\n${envLines}\n`
  )

  console.log('\n====================================================')
  console.log('  Boxme Payroll — Seed Account Passwords')
  console.log('====================================================')
  for (const acc of accounts) {
    console.log(`  ${acc.email.padEnd(32)} ${passwords[acc.key]}`)
  }
  console.log('====================================================')
  console.log('\n✅  .env.seed written (gitignored)')
  console.log('⚠️   Save passwords to 1Password → Boxme > Payroll Seed Accounts')
  console.log('⚠️   Users must change password on first login (force_password_change=true)\n')
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
