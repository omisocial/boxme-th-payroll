#!/usr/bin/env tsx
/**
 * Generates random passwords for seed accounts, hashes them with bcrypt-compatible
 * format, writes .env.seed (gitignored), and emits 008_seed_ready.sql with hashes.
 *
 * Run: npx tsx scripts/gen-seed-passwords.ts
 *
 * Output:
 *   .env.seed              — plaintext passwords (KEEP PRIVATE, add to 1Password)
 *   api/src/db/008_seed_ready.sql — 008_seed.sql with %%HASH_*%% replaced
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

// Simple SHA-256 hash for seed — in production Workers use Argon2 WASM.
// We store a marker prefix so the auth layer knows it's a seed hash requiring
// Argon2 re-hash on first successful login.
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

writeFileSync(resolve(ROOT, '.env.seed'), `# Boxme Payroll — Seed Passwords\n# Generated: ${new Date().toISOString()}\n# Store in 1Password → Boxme > Payroll Seed Accounts\n# DO NOT COMMIT\n\n${envLines}\n`)

// Write 008_seed_ready.sql — replace INSERT OR IGNORE with UPSERT-style UPDATE
// so re-running won't skip existing rows with placeholder hashes
const templatePath = resolve(ROOT, 'api/src/db/008_seed.sql')
let sql = readFileSync(templatePath, 'utf-8')
for (const acc of accounts) {
  sql = sql.replace(new RegExp(acc.placeholder.replace(/%%/g, '%%').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), hashes[acc.key])
}
// Also emit UPDATE statements in case rows already exist (fixes INSERT OR IGNORE race)
const updateStatements = accounts.map(acc =>
  `UPDATE users SET password_hash='${hashes[acc.key]}', force_password_change=1 WHERE email='${acc.email}';`
).join('\n')
sql += '\n-- Force-update password hashes (idempotent)\n' + updateStatements + '\n'
writeFileSync(resolve(ROOT, 'api/src/db/008_seed_ready.sql'), sql)

// Print to console
console.log('\n====================================================')
console.log('  Boxme Payroll — Seed Account Passwords')
console.log('====================================================')
for (const acc of accounts) {
  console.log(`  ${acc.email.padEnd(32)} ${passwords[acc.key]}`)
}
console.log('====================================================')
console.log('\n✅ .env.seed written (gitignored)')
console.log('✅ api/src/db/008_seed_ready.sql written')
console.log('\n⚠️  Save passwords to 1Password → Boxme > Payroll Seed Accounts')
console.log('⚠️  Users must change password on first login\n')
