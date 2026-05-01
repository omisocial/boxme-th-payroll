# Implementation Checklist — Phase 2 Backend

> Ordered by dependency. Each step ~20-40 min. Complete before moving on.

---

## W1 — Backend Skeleton + Auth

- [ ] **1.1** Install backend deps in `webapp/package.json`: `hono`, `better-auth`, `zod`, `@aws-sdk/client-s3` (R2), `argon2` (WASM build)
- [ ] **1.2** Create `webapp/functions/api/[[route]].ts` — Hono app entry, health check `GET /api/health → { ok: true }`
- [ ] **1.3** Update `webapp/wrangler.toml`: add D1 binding `DB`, R2 binding `FILES`, KV binding `SESSION_KV`
- [ ] **1.4** Create `api/src/db/001_foundation.sql` — countries, warehouses, departments, shifts tables
- [ ] **1.5** Create `api/src/db/002_workers.sql` — workers, worker_grades, job_types
- [ ] **1.6** Create `api/src/db/003_compensation.sql` — pay_components, pay_rules, rate_configs
- [ ] **1.7** Create `api/src/db/004_attendance.sql` — attendance_records, damages, damage_schedule
- [ ] **1.8** Create `api/src/db/005_payroll.sql` — payroll_daily, payroll_period, payroll_period_lines
- [ ] **1.9** Create `api/src/db/006_exports.sql` — bank_export_templates, bank_exports
- [ ] **1.10** Create `api/src/db/007_auth.sql` — users, sessions, audit_log
- [ ] **1.11** Create `scripts/gen-seed-passwords.ts` — generate 24-char random passwords, print to console, write `.env.seed` (gitignored)
- [ ] **1.12** Create `api/src/db/008_seed.sql` — countries TH/VN/PH, TH departments/shifts, 6 default users (Argon2 hashes from .env.seed), TH rate config 500 THB/day, K-BANK + SCB bank templates
- [ ] **1.13** Run `wrangler d1 create boxme-payroll`, apply migrations: `wrangler d1 execute boxme-payroll --file=...`
- [ ] **1.14** Implement Better-auth in `api/src/auth/index.ts` — email+password provider, sessions in D1 + KV cache
- [ ] **1.15** Implement RBAC middleware `api/src/auth/rbac.ts` — `requireRole(roles[])`, `requireCountry(code)` helpers
- [ ] **1.16** Mount auth routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- [ ] **1.17** Add `POST /api/auth/forgot` + `POST /api/auth/reset` (Resend email if key present, else log token to console in dev)
- [ ] **1.18** Verify: `curl POST /api/auth/login` with admin creds → 200 + set-cookie; `GET /api/auth/me` → user object; logout → 200 + clear cookie

---

## W2 — Payroll Engine Migration

- [ ] **2.1** Create `shared/types/payroll.ts` — copy `AttendanceRow`, `PayrollResult`, `EngineConfig`, `Flag` from `webapp/src/payroll/types.ts`
- [ ] **2.2** Create `shared/types/api.ts` — standard response envelope `{ success, data, message, meta? }`
- [ ] **2.3** Port `webapp/src/payroll/engine.ts` → `api/src/engines/compute.ts` (pure function, no DOM deps)
- [ ] **2.4** Port `webapp/src/payroll/aggregate.ts` → `api/src/engines/aggregate.ts`
- [ ] **2.5** Add `api/src/engines/rule-resolver.ts` — resolves active `pay_components` + `pay_rules` from D1 for a given (country, dept, grade, shift, date), injects into EngineConfig
- [ ] **2.6** Create `POST /api/payroll/compute` — body: `{ attendance_row, worker_id?, country }` → run engine, return PayrollResult
- [ ] **2.7** Create `POST /api/payroll/batch` — body: `{ period_id }` → query all attendance for period, compute each, upsert `payroll_daily`, return summary
- [ ] **2.8** Write unit tests in `api/src/engines/__tests__/compute.test.ts` — replay all 12 reference cases from `spec_output/analysis/test_cases.csv`, assert within 0.01 THB
- [ ] **2.9** Run tests: `npx vitest run` — all 12 must pass before proceeding
- [ ] **2.10** Stub out `webapp/src/payroll/engine.ts` — keep types, replace computation with `fetch('/api/payroll/compute', ...)` (maintain FE preview UX intact)

---

## W3 — CRUD Routes + FE Data Layer

- [ ] **3.1** Implement `api/src/routes/workers.ts` — GET list (filter country/dept/status/search), GET :id, POST, PATCH, DELETE (soft)
- [ ] **3.2** Implement `api/src/routes/attendance.ts` — GET list (filter date/dept/status), GET :id, POST (manual entry), PATCH, DELETE (soft), POST :id/compute
- [ ] **3.3** Implement `api/src/routes/damages.ts` — GET list, POST, PATCH, GET :id/schedule, POST :id/schedule, PATCH :id/schedule/:sid
- [ ] **3.4** Implement Excel import pipeline in `api/src/routes/attendance.ts`:
  - `POST /api/attendance/import` — accept multipart, parse with SheetJS WASM, validate, return preview JSON (no DB write)
  - `POST /api/attendance/import/commit` — body: `{ rows[], import_session_id }` → batch insert 500/tx → trigger compute each row → return summary
- [ ] **3.5** Install `react-query` (`@tanstack/react-query`) in webapp — wrap `App.tsx` with `QueryClientProvider`
- [ ] **3.6** Refactor `WorkerTable.tsx` — replace local state with `useQuery('/api/workers', ...)`
- [ ] **3.7** Refactor `Uploader.tsx` — POST to `/api/attendance/import`, show server preview, confirm → commit
- [ ] **3.8** Refactor `StatCards.tsx` — fetch from `/api/reports/period-summary/:period_id`
- [ ] **3.9** Add `LoginPage.tsx` — email + password form → `POST /api/auth/login` → redirect to `/`; show error on 401
- [ ] **3.10** Add `ChangePasswordPage.tsx` — shown on `force_password_change = true`; POST new password → redirect to `/`
- [ ] **3.11** Add auth gate in `App.tsx` — `GET /api/auth/me` on mount; redirect to `/login` if 401
- [ ] **3.12** Update `Toolbar.tsx` — show user email badge, role chip, logout button (POST /api/auth/logout)

---

## W4 — Config Admin UI

- [ ] **4.1** Implement `api/src/routes/configs.ts`:
  - `GET/POST/PATCH /api/config/rates` — rate_configs CRUD (country_admin + above)
  - `GET/POST/PATCH /api/config/components` — pay_components CRUD
  - `GET/POST/PATCH /api/config/rules` — pay_rules CRUD
  - `GET/POST/PATCH /api/config/holidays` — holidays bulk import + list
  - `GET/POST/PATCH /api/config/work-limits` — legal_limits
- [ ] **4.2** Implement `api/src/routes/admin.ts`:
  - `GET/POST/PATCH /api/admin/users` — user management (super_admin only)
  - `GET/PATCH /api/admin/countries` — flip active flag
  - `GET/POST/PATCH /api/admin/warehouses`
- [ ] **4.3** Create `AdminPage.tsx` — tab layout: Rates | Pay Components | Rules | Holidays | Users | Countries (roles shown per tab)
- [ ] **4.4** Rate config tab — table of rate_configs, effective_from datepicker, "Add new version" creates next effective_from row (immutable history)
- [ ] **4.5** Pay components tab — list + form (code, formula_type select, formula_value, condition_json textarea with syntax hint, effective_from)
- [ ] **4.6** Users tab (super_admin only) — list users, invite (POST generates magic link email), role/country dropdown, deactivate
- [ ] **4.7** Countries tab — toggle active per country, set default currency/locale
- [ ] **4.8** Add `LangSwitcher.tsx` country selector — separate from language; updates `?country=` param; persists to session

---

## W5 — Period Close + Bank Export

- [ ] **5.1** Implement `api/src/routes/periods.ts`:
  - `GET /api/periods` — list (open, locked, approved, exported)
  - `POST /api/periods` — create period (name, from_date, to_date, country)
  - `POST /api/periods/:id/lock` — transition `open → locked` (requires hr+)
  - `POST /api/periods/:id/approve` — transition `locked → approved` (requires country_admin+)
  - `POST /api/periods/:id/export?bank=K-BANK` — generate CSV/TXT → upload R2 → create bank_exports row → return download URL
  - `GET /api/periods/:id/exports` — list export files
- [ ] **5.2** Implement `api/src/engines/bank-export.ts` — reads `bank_export_templates` JSON config → generates file bytes (column order, encoding TIS-620 or UTF-8 per bank spec)
- [ ] **5.3** Implement `GET /api/exports/:id/download` — R2 pre-signed URL (15 min TTL)
- [ ] **5.4** Implement `api/src/utils/r2.ts` — `uploadFile(key, data, contentType)`, `getSignedUrl(key, ttl)`
- [ ] **5.5** Seed K-BANK + SCB bank_export_templates in `008_seed.sql`
- [ ] **5.6** Create `PeriodsPage.tsx` — list periods with status badges, action buttons per state, export modal with bank selector, download link
- [ ] **5.7** Implement Cron Trigger in `wrangler.toml` — `[crons] schedule = "0 1 * * *"` → Worker handler: recompute `payroll_daily` for all `open` periods (idempotent)
- [ ] **5.8** Add `GET /api/reports/period-summary/:period_id` — total workers, total gross, total deductions, net pay, OT hours
- [ ] **5.9** Add `GET /api/reports/late-leaderboard/:period_id` + `GET /api/reports/ot-leaderboard/:period_id`

---

## W6 — Multi-Country Activation (VN)

- [ ] **6.1** Add VN-specific seed rows: departments (warehouse HAN-1, SGN-1), shifts (VN standard), `rate_configs` (placeholder VND rate)
- [ ] **6.2** Add VN i18n strings to `src/i18n/dict.ts` (Vietnamese translations for all keys)
- [ ] **6.3** Admin: flip `countries.active = TRUE` for VN
- [ ] **6.4** Test cross-country isolation: login as `th.hr@boxme.tech` → `GET /api/workers?country=VN` → 403
- [ ] **6.5** Test VN login: login as `vn.hr@boxme.tech` → `GET /api/workers?country=VN` → 200 empty list (no workers yet)
- [ ] **6.6** VN work-limit seed: `legal_limits` row for VN (8h/day, 48h/week per Labour Code)
- [ ] **6.7** Document PH gating in admin UI tooltip — "Activate when PH ops confirmed"

---

## W7 — Hardening

- [ ] **7.1** Add `api/src/utils/audit.ts` — every mutating API call appends to `audit_log(user_id, action, entity, entity_id, before, after, ip)`
- [ ] **7.2** Add rate limiting via KV — `ratelimit:{ip}:{minute}` counter; 429 after 60 req/min per IP
- [ ] **7.3** Add CSP header in `webapp/public/_headers`:
  ```
  /api/*
    Content-Security-Policy: default-src 'none'
  /*
    Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
  ```
- [ ] **7.4** Add PDPA masking middleware — `viewer` role: bank account fields replaced with `****XXXX` in all API responses
- [ ] **7.5** Add nightly D1 backup Cron Trigger — `api/src/crons/backup.ts` → `wrangler d1 export` via REST → upload to R2 `backups/YYYY-MM-DD.sql.gz` → delete >30 days old
- [ ] **7.6** Add `GET /api/admin/audit-log` — paginated, filterable by user/entity/date (super_admin only)
- [ ] **7.7** Add audit log viewer tab in `AdminPage.tsx`
- [ ] **7.8** Test Argon2 timing — login endpoint response must be >200ms (prevent timing oracle)
- [ ] **7.9** Verify all 12 reference test cases pass end-to-end via API (not just unit tests)

---

## W8 — UAT Prep + Deploy

- [ ] **8.1** Create production D1 + R2 + KV resources: `wrangler d1 create boxme-payroll-prod`, etc.
- [ ] **8.2** Set production secrets: `wrangler secret put RESEND_API_KEY`
- [ ] **8.3** Configure custom domain `payroll.boxme.tech` → Cloudflare Pages project
- [ ] **8.4** Deploy: `wrangler pages deploy dist --project-name=boxme-payroll`
- [ ] **8.5** Run seed on production: `wrangler d1 execute boxme-payroll-prod --file=008_seed.sql` → capture password printout → store in 1Password
- [ ] **8.6** Send login credentials to `th.hr@boxme.tech` user via encrypted channel
- [ ] **8.7** Parallel run checklist: HR TH runs 1 full month using both Excel (old) and this app (new); compare totals worker by worker
- [ ] **8.8** Document deviations found in parallel run → fix → re-run until 0 discrepancies > 0.01 THB
- [ ] **8.9** Go-live sign-off: period closed + bank export submitted + accepted by K-BANK / SCB

---

## Verification Matrix

| Test | Command/Action | Expected |
|---|---|---|
| Auth login | `POST /api/auth/login` admin creds | 200 + session cookie |
| RBAC block | `PATCH /api/workers/:id` as viewer | 403 |
| Engine parity | `POST /api/payroll/compute` with test case row 1-12 | ≤ 0.01 THB diff vs CSV |
| Excel import | Upload sample `วันที่ 1.xlsx` | Preview 50 rows, no DB write yet |
| Excel commit | Confirm preview → commit | 50 rows in D1, payroll computed |
| Country gate | th.hr GET /api/workers?country=VN | 403 |
| Period close | open → lock → approve → export K-BANK | R2 file downloadable |
| Config change | Rate 500 → 550, recompute | New attendance uses 550, old records unchanged |
| Audit log | Any PATCH → check audit_log | Row appended with before/after |
| PDPA | GET /api/workers as viewer | bank_account = ****XXXX |
