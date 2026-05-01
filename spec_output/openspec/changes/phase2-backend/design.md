# Design: Phase 2 — Cloudflare Full-Stack Backend

**Goal:** Promote Boxme Seasonal Payroll from a client-side Excel processor to a production-grade, multi-country, configurable payroll platform — with persistent storage, authentication, RBAC, and a configurable rule engine — running entirely on Cloudflare free tier.

**Date:** 2026-04-30  
**Status:** APPROVED FOR IMPLEMENTATION  
**Scope:** Phase 1 → Phase 2 upgrade (TH production-ready, VN/PH seeded)

---

## Context & Technical Approach

### Why Cloudflare-only (not Supabase)

| Concern | Cloudflare decision |
|---|---|
| Latency | Workers edge-native, D1 globally replicated; vs Supabase single-region unless Pro |
| Cost | D1 5GB + 5M reads + 100k writes/day free; R2 10GB free; KV free — covers <50 internal users indefinitely |
| Auth | Better-auth (MIT) runs natively on Workers + D1; no external dep |
| Ops complexity | Single Wrangler config for FE (Pages) + BE (Pages Functions / Workers); one `wrangler deploy` |
| Supabase trigger | Only activate if D1 sustained >80k writes/day for >7 days (very unlikely at <50 users) |

### API delivery: Pages Functions (not standalone Workers)

`/api/*` routes live in `webapp/functions/api/[[route]].ts` — a single [wildcard catch-all](https://developers.cloudflare.com/pages/functions/routing/) that delegates to Hono. Benefits:
- Same domain (`payroll.boxme.tech`) → no CORS headers needed  
- Same `wrangler.toml` bindings (D1, R2, KV) shared between Pages + Functions  
- Zero extra `wrangler.toml` or project; one `wrangler pages deploy` ships both

### Payroll engine location

Engine source of truth moves to `api/src/engines/` (TypeScript, pure functions, no IO). FE imports the same shared types from `shared/` but calls the API for computation — client-side preview kept only for instant drag-and-drop UX; final numbers always computed server-side.

### Auth: Better-auth on Workers/D1

- Session stored in D1 `sessions` table + KV cache (fast lookup on every request)  
- Cookie-based (`HttpOnly`, `Secure`, `SameSite=Strict`) — no JWT leakage risk  
- Roles stored in `users.role` + `users.country_scope` — resolved in middleware before route handler  
- Password hashed with Argon2 (WASM build available on Workers)  
- Magic-link via Resend (100 emails/day free) for password reset

---

## Repo Layout After This Phase

```
Session_Payment/
├── webapp/                        # React/Vite (existing)
│   ├── src/
│   │   ├── payroll/               # types.ts stays; engine.ts → stub calling API
│   │   ├── components/
│   │   ├── i18n/
│   │   └── ...
│   ├── functions/                 # NEW — Pages Functions (runs as Workers)
│   │   └── api/
│   │       └── [[route]].ts       # Hono router entry point
│   ├── wrangler.toml              # add D1, R2, KV bindings
│   └── package.json               # add hono, better-auth, zod
│
├── api/                           # NEW — shared backend source
│   ├── src/
│   │   ├── router.ts              # Hono app, mounts sub-routers
│   │   ├── auth/                  # better-auth setup, RBAC middleware
│   │   ├── routes/
│   │   │   ├── workers.ts
│   │   │   ├── attendance.ts
│   │   │   ├── payroll.ts
│   │   │   ├── damages.ts
│   │   │   ├── periods.ts
│   │   │   ├── configs.ts
│   │   │   ├── admin.ts
│   │   │   └── exports.ts
│   │   ├── engines/               # payroll engine (ported from webapp/src/payroll)
│   │   │   ├── compute.ts
│   │   │   ├── aggregate.ts
│   │   │   └── bank-export.ts
│   │   ├── db/
│   │   │   ├── schema.sql         # D1 migrations (numbered)
│   │   │   ├── seed.sql           # countries, departments, default users
│   │   │   └── queries.ts         # typed query helpers
│   │   └── utils/
│   │       ├── r2.ts              # upload/download helpers
│   │       ├── email.ts           # Resend wrapper
│   │       └── audit.ts           # audit_log writer
│
└── shared/                        # NEW — types shared FE + BE
    └── types/
        ├── api.ts                 # request/response shapes
        ├── payroll.ts             # PayrollResult, AttendanceRow (from webapp)
        └── countries.ts           # CountryCode, RoleCode
```

---

## Proposed Changes

### 1. wrangler.toml — add bindings

```toml
name = "boxme-th-payroll"
compatibility_date = "2026-04-30"
pages_build_output_dir = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "boxme-payroll"
database_id = "<created-on-first-deploy>"

[[r2_buckets]]
binding = "FILES"
bucket_name = "boxme-payroll-files"

[[kv_namespaces]]
binding = "SESSION_KV"
id = "<created-on-first-deploy>"

[vars]
RESEND_API_KEY = ""   # set via wrangler secret put
DEFAULT_COUNTRY = "TH"
```

### 2. D1 Schema (numbered migrations)

**001_foundation.sql** — countries, warehouses, departments, shifts  
**002_workers.sql** — workers, worker_grades, job_types  
**003_compensation.sql** — pay_components, pay_rules, rate_configs  
**004_attendance.sql** — attendance_records, damages, damage_schedule  
**005_payroll.sql** — payroll_daily, payroll_period, payroll_period_lines  
**006_exports.sql** — bank_export_templates, bank_exports  
**007_auth.sql** — users, sessions, roles  
**008_audit.sql** — audit_log  
**009_seed.sql** — countries TH/VN/PH, default users (password hashed), TH departments/shifts/rates

Key design decisions baked into schema:
- Every table has `country_code TEXT NOT NULL DEFAULT 'TH'` for multi-country isolation
- `effective_from DATE` on `rate_configs` and `pay_rules` — rate changes don't break historical records
- `status` state machine on `payroll_periods`: `open → locked → approved → exported`
- Soft deletes everywhere (`deleted_at` or `status = 'resigned'`)
- `audit_log` appended by DB trigger + application layer (belt & suspenders)

### 3. Authentication & RBAC

**Roles and country scope:**

| Role | Country scope | Can do |
|---|---|---|
| `super_admin` | * (all) | Everything, including user management, system config |
| `country_admin` | Assigned country | Config management, period close, user invite for their country |
| `hr` | Assigned country | Worker CRUD, attendance import, payroll compute, period review |
| `supervisor` | Assigned warehouse | Attendance entry, damage log, read payroll |
| `viewer` | Assigned country | Read-only, no PII bank account |

Middleware pseudocode:
```typescript
// Every route after /api/auth/*
const session = await getSession(c, db, kv)
if (!session) return c.json({ success: false, message: 'Unauthorized' }, 401)
c.set('user', session.user)
// Route-level guard
requireRole(['hr', 'country_admin', 'super_admin'])
requireCountry('TH') // resolved from JWT + route param
```

**Default seed accounts** (created in `009_seed.sql`, passwords Argon2-hashed):

| Email | Role | Country | Initial password |
|---|---|---|---|
| `admin@boxme.tech` | `super_admin` | * | → printed to console at first `wrangler d1 execute` |
| `th.hr@boxme.tech` | `hr` | TH | → printed to console |
| `th.supervisor@boxme.tech` | `supervisor` | TH | → printed to console |
| `vn.hr@boxme.tech` | `hr` | VN | → printed to console (country inactive; login fails until VN enabled) |
| `ph.hr@boxme.tech` | `hr` | PH | → printed to console |
| `viewer@boxme.tech` | `viewer` | * | → printed to console |

All accounts have `force_password_change = TRUE`. Login redirects to `/change-password` on first use.

Passwords are 24-char random alphanumeric, generated at seed time by a Node script (`scripts/gen-seed-passwords.ts`), stored in `.env.seed` (gitignored), then hashed into the SQL.

### 4. API Surface

All endpoints under `/api/` — Hono router, JSON responses `{ success, data, message }`.

**Auth:** `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/forgot`, `/api/auth/reset`  
**Workers:** `/api/workers` CRUD + `/api/workers/:id/timesheets`  
**Attendance:** `/api/attendance` CRUD + `/api/attendance/import` (multipart Excel) + `/api/attendance/:id/compute`  
**Damages:** `/api/damages` CRUD + `/api/damages/:id/schedule`  
**Payroll:** `/api/payroll/compute` (single worker) + `/api/payroll/batch` (period)  
**Periods:** `/api/periods` state machine + `/api/periods/:id/export`  
**Config:** `/api/config/rates`, `/api/config/components`, `/api/config/rules`, `/api/config/holidays`  
**Admin:** `/api/admin/users`, `/api/admin/countries`, `/api/admin/warehouses`  
**Exports:** `/api/exports/:id/download` (R2 signed URL)

### 5. Excel Import Pipeline

```
[Browser] → multipart POST /api/attendance/import
         → Worker: parse with SheetJS (WASM)
         → validate rows (country + warehouse header)
         → return preview JSON (no write yet)
         → [User confirms] → POST /api/attendance/import/commit?session_id=
         → batch insert attendance_records (500 rows/tx)
         → trigger compute for each row
         → return summary {imported, skipped, errors}
```

Large file (>5MB): upload to R2 first → Worker picks from R2 → same pipeline. Avoids 10MB body limit on Workers free tier.

### 6. Configurable Pay Components (admin UI)

HR can create/edit `pay_components` rows:
- `code`: unique identifier (e.g., `meal_allowance`)
- `formula_type`: `fixed` | `per_hour` | `multiplier` | `expression`
- `formula_value`: number or JS-safe expression string (evaluated server-side in isolated VM)
- `condition_json`: when this component applies (dept, grade, shift, day_type)
- `effective_from`: date versioning

The engine resolves components at compute time by specificity score (more specific condition = wins). This replaces hardcoded `if dept === 'BM'` branches in current `engine.ts`.

### 7. Multi-Country Gate

Countries table:
```sql
INSERT INTO countries VALUES
  ('TH', 'Thailand', 'THB', 'Asia/Bangkok', 'th', TRUE),   -- active
  ('VN', 'Vietnam',  'VND', 'Asia/Ho_Chi_Minh', 'vi', FALSE), -- gated
  ('PH', 'Philippines','PHP','Asia/Manila', 'en', FALSE);    -- gated
```

Admin can flip `active = TRUE` in UI. All API routes check `country.active` and return `423 Locked` if country is inactive. FE country switcher hides inactive countries from non-admins.

---

## Frontend Changes

| Component | Change |
|---|---|
| `Uploader.tsx` | POST to `/api/attendance/import` instead of local parse → preview → commit flow |
| `WorkerTable.tsx` | Fetch from `/api/workers` + React Query (SWR-style) |
| `StatCards.tsx` | Data from `/api/reports/period-summary` |
| `Toolbar.tsx` | Add login state (show user email + logout) |
| New: `LoginPage.tsx` | Email/password form → `/api/auth/login` |
| New: `AdminPage.tsx` | Config rates, components, users, countries |
| New: `PeriodsPage.tsx` | Period list, state transitions, bank export download |
| `LangSwitcher.tsx` | Add country selector (separate from language) |

No UI library change — keep Tailwind + lucide-react (no shadcn to avoid bundle bloat).

---

## Verification

1. **Auth**: login with `admin@boxme.tech` → get session cookie → call `/api/admin/users` → list 6 users.
2. **RBAC**: login with `viewer@boxme.tech` → call `PATCH /api/workers/:id` → get 403.
3. **Payroll engine parity**: run all 12 reference test cases via `/api/payroll/compute` → match `spec_output/analysis/test_cases.csv` within 0.01 THB.
4. **Excel import**: upload `วันที่ 1.xlsx` sample → preview 50 rows → commit → check D1 rows.
5. **Multi-country gate**: call `GET /api/workers?country=VN` as `th.hr@boxme.tech` → 403 (wrong country).
6. **Period export**: create period → add attendance → lock → approve → export K-BANK → download R2 file → validate column order matches bank spec.
7. **Config change**: update `rate_configs` base_daily to 550 → recompute attendance from that date → verify new amount; historical records unchanged.
