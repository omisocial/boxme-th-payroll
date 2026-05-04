# CONTINUITY — Boxme Seasonal Payroll

**Updated:** 2026-05-01
**Project:** `/Volumes/Data/Boxme/micro_tools/Session_Payment`
**Live:** https://boxme-th-payroll.pages.dev

## Active Goal
UAT end-to-end walkthrough — seed real workers from Members sheet, import April 2026 attendance via server, run period lock → approve → export flow on real data.

## Current Phase
**UAT** — PR #3 merged to main. Phase 4 code live. Next: deploy + run UAT walkthrough (tasks 3.1–3.8).

## Next Actions (first 3 tasks)
1. Deploy: `cd webapp && npm run deploy` (builds + pushes to Cloudflare Pages)
2. `3.1`–`3.3` — Login as `th.hr@boxme.tech` → Workers tab → Bulk Import → upload `Thailand_Sessonal_Payment.xlsx` → verify workers list count. Then Payroll tab → upload xlsx → "Save to DB" → pick warehouse + `2026-04` → preview → Commit.
3. `3.4`–`3.7` — Periods tab → New Period (April 2026) → Lock → (admin) Approve → Export Bank CSV → verify CSV in Excel.

## Key Architectural Decisions
- **Stack pivoted to Supabase** (Mar 2026): D1/R2/KV → Postgres + Storage. Service role key in Cloudflare Pages secret. `nodejs_compat` flag enables `node:crypto`.
- **MVP v0.2 deployed**: Periods/Workers/Admin tabs functional. Backend API complete (5 routes + admin).
- **Two UI gaps identified for UAT**: no bulk worker import (~50+ rows in Members), no server-side attendance import button (endpoint exists, no UI).
- **Decision**: build proper bulk-upload UI in both tabs — reusable for monthly ops, ~3 hr work, vs one-off SQL/curl seed.

## Default Accounts (seeded)
| Email | Role | Country |
|---|---|---|
| admin@boxme.tech | super_admin | * |
| th.hr@boxme.tech | hr | TH |
| th.supervisor@boxme.tech | supervisor | TH |
| vn.hr@boxme.tech | hr | VN |
| ph.hr@boxme.tech | hr | PH |
| viewer@boxme.tech | viewer | * |
Passwords: in `.env.seed` (gitignored) → 1Password.

## Prereqs Already Seeded
- 2 TH warehouses: `Bangkhen Warehouse 1` (TH-BKK-1), `Bangkhen Warehouse 2` (TH-BKK-2)
- Default rate config: 500 THB/day, 1.5× OT, effective 2026-01-01

## Source Data
- `Thailand_Sessonal_Payment.xlsx` (1.3 MB, root of repo, gitignored)
- Members sheet → workers (name, nickname, phone, bank, dept)
- Daily sheets `วันที่ N` → attendance (data starts row 9, header at row 8)
- Period: April 2026

## Mistakes to Avoid
- Do NOT commit `.env.seed`, `008_seed_ready.sql`, `supabase_schema_ready.sql` — contain hashed passwords
- Do NOT use `git add -A` blindly — sensitive files re-stage
- Do NOT amend commits when pre-commit hook fails — make a NEW commit
- Setting a Cloudflare Pages secret does NOT auto-redeploy — must `wrangler pages deploy dist` after
- Supabase JSONB columns: pass raw objects, NOT `JSON.stringify()` (unlike D1)
- Excel sheet header row is index 7 (data from index 8), NOT index 0 — server import had this bug, fixed in P0
- New Hono routes that take `period_id` (or any tenant-owned ID) MUST verify scope against `user.country_scope` AND `user.warehouse_id` before reading/mutating — `guard()` only checks role, not data ownership. Cross-tenant exposure caught in 2026-05 UX overhaul review (periodLines.ts, reports.ts). Pattern: add `assertPeriodScope(sb, periodId, user)` helper or inline the check.
