#!/usr/bin/env tsx
/**
 * Generates random passwords for seed accounts, hashes with SHA-256 seed format,
 * writes .env.seed (gitignored), 008_seed_ready.sql (D1), and supabase_schema_ready.sql.
 *
 * Run: npx tsx scripts/gen-seed-passwords.ts
 */

import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '../..')

function genPassword(length = 24): string {
  return randomBytes(length)
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length)
}

function seedHash(password: string): string {
  const hash = createHash('sha256').update(password).digest('hex')
  return `$seed$sha256$${hash}`
}

const accounts = [
  { key: 'ADMIN',  email: 'admin@boxme.tech',        placeholder: '%%HASH_ADMIN%%' },
  { key: 'TH_HR', email: 'th.hr@boxme.tech',         placeholder: '%%HASH_TH_HR%%' },
  { key: 'TH_SUP',email: 'th.supervisor@boxme.tech', placeholder: '%%HASH_TH_SUP%%' },
  { key: 'VN_HR', email: 'vn.hr@boxme.tech',         placeholder: '%%HASH_VN_HR%%' },
  { key: 'PH_HR', email: 'ph.hr@boxme.tech',         placeholder: '%%HASH_PH_HR%%' },
  { key: 'VIEWER',email: 'viewer@boxme.tech',         placeholder: '%%HASH_VIEWER%%' },
]

const passwords: Record<string, string> = {}
const hashes: Record<string, string> = {}

for (const acc of accounts) {
  const pw = genPassword()
  passwords[acc.key] = pw
  hashes[acc.key] = seedHash(pw)
}

// Write .env.seed
const envLines = accounts.map(a =>
  `SEED_PASSWORD_${a.key}=${passwords[a.key]}  # ${a.email}`
).join('\n')

writeFileSync(
  resolve(ROOT, '.env.seed'),
  `# Boxme Payroll — Seed Passwords\n# Generated: ${new Date().toISOString()}\n# Store in 1Password → Boxme > Payroll Seed Accounts\n# DO NOT COMMIT\n\n${envLines}\n`
)

function replacePlaceholders(sql: string): string {
  for (const acc of accounts) {
    sql = sql.replace(
      new RegExp(acc.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      hashes[acc.key]
    )
  }
  return sql
}

// Write 008_seed_ready.sql (for D1 legacy reference)
const d1TemplatePath = resolve(ROOT, 'api/src/db/008_seed.sql')
try {
  let d1Sql = readFileSync(d1TemplatePath, 'utf-8')
  d1Sql = replacePlaceholders(d1Sql)
  const updateStatements = accounts.map(acc =>
    `UPDATE users SET password_hash='${hashes[acc.key]}', force_password_change=1 WHERE email='${acc.email}';`
  ).join('\n')
  d1Sql += '\n-- Force-update password hashes (idempotent)\n' + updateStatements + '\n'
  writeFileSync(resolve(ROOT, 'api/src/db/008_seed_ready.sql'), d1Sql)
  console.log('✅ api/src/db/008_seed_ready.sql written')
} catch {
  console.warn('⚠️  api/src/db/008_seed.sql not found, skipping D1 seed')
}

// Write supabase_schema_ready.sql (run in Supabase SQL Editor)
const sbTemplatePath = resolve(ROOT, 'api/src/db/supabase_schema.sql')
let sbSql = readFileSync(sbTemplatePath, 'utf-8')
sbSql = replacePlaceholders(sbSql)
writeFileSync(resolve(ROOT, 'api/src/db/supabase_schema_ready.sql'), sbSql)
console.log('✅ api/src/db/supabase_schema_ready.sql written')

// Print to console
console.log('\n====================================================')
console.log('  Boxme Payroll — Seed Account Passwords')
console.log('====================================================')
for (const acc of accounts) {
  console.log(`  ${acc.email.padEnd(32)} ${passwords[acc.key]}`)
}
console.log('====================================================')
console.log('\n✅ .env.seed written (gitignored)')
console.log('\n⚠️  Save passwords to 1Password → Boxme > Payroll Seed Accounts')
console.log('⚠️  Users must change password on first login')
console.log('\n📋 To apply to Supabase:')
console.log('   Run api/src/db/supabase_schema_ready.sql in Supabase SQL Editor\n')
