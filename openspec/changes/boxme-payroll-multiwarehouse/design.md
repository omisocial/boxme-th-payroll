# Design: Boxme Payroll — Multi-warehouse / Multi-country Refactor

## Goal
Refactor Boxme TH Payroll MVP v0.1 into Boxme Payroll: multi-warehouse, multi-country, multi-currency, multi-language tool for seasonal worker (CTV) pay calculation.

## Context & Technical Approach
Current MVP is tightly coupled to Thailand: hardcoded THB rate, Thai keywords for leave/dept classification, single default warehouse `wh-th-bkk-1`, monolithic `App.tsx` (297 lines), no warehouse picker, redundant Periods page. DB schema already includes `countries`, `warehouses`, `rate_configs`, `pay_components`, `legal_limits` — forward-compatible but unused by frontend.

Approach: keep existing stack (React 19 + Vite + Hono + D1/Supabase + custom i18n). Don't introduce new state libs. Use React Context (Warehouse, Config, Auth). Push all hardcoded TH-specific values into `payroll_engine_configs` (new) + `excel_templates` (new) tables. Add header warehouse switcher. Collapse Periods → Payroll page. Add `pending_update` worker status with auto-create on attendance import.

## Proposed Changes

### Frontend
- **`webapp/src/App.tsx`** → split into `app/Router.tsx` (route switch) + `app/AppShell.tsx` (header/nav/footer). Move all view state out.
- **`webapp/src/context/`** (new) → `WarehouseContext`, `ConfigContext`, `AuthContext`.
- **`webapp/src/features/`** (new) → `payroll/`, `workers/`, `admin/`, `settings/`. Move existing `components/periods/*` content into `features/payroll/PayrollPage.tsx` (period selector inline).
- **`webapp/src/payroll/engine.ts`** → drop `DEFAULT_CONFIG`. Accept full `EngineConfig` from caller, including `currency`, `deptKeywords`, `paidLeaveKeywords`, `manualCheckinKeywords`.
- **`webapp/src/payroll/parser.ts`** → accept `ExcelTemplate` (sheet/column aliases) param.
- **`webapp/src/features/payroll/PayrollBadges.tsx`** (new) → render pending workers count + OT outliers + computed totals immediately after compute.
- **`webapp/src/features/workers/WorkersPage.tsx`** → add `pending_update` filter chip with badge count.

### Backend
- **`api/src/db/migrations/008_engine_configs.sql`** (new) → `payroll_engine_configs` table.
- **`api/src/db/migrations/009_excel_templates.sql`** (new).
- **`api/src/db/migrations/010_user_warehouses.sql`** (new) — M:N user↔warehouse.
- **`api/src/db/migrations/011_workers_pending_status.sql`** (new) — `pending_update` enum value + `created_via` column.
- **`api/src/services/engine-config.ts`** (new) — load/cache config per (country, warehouse).
- **`api/src/services/worker-resolver.ts`** (new) — match attendance row → worker; auto-create with `pending_update` if miss.
- **`api/src/services/formula-evaluator.ts`** (new, Phase 3) — evaluate `pay_components.formula_type='expression'`.

### Shared
- **`shared/types/payroll.ts`** → extend `EngineConfig` with currency/keyword fields.

## Verification

1. **Phase 1 done when:** TH workflow still works end-to-end; `engine.ts` no longer references `DEFAULT_CONFIG`; Periods nav tab gone; "X CTV chờ cập nhật" badge appears after import; `npm run build` passes.
2. **Phase 2 done when:** Super admin can switch warehouse from header; warehouse_admin sees only assigned warehouse data; engine config editor saves to DB.
3. **Phase 3 done when:** VN warehouse with VN sheet names parses correctly; lang switcher updates currency formatting.
4. **Tests:** `npm test` in webapp + api; manual smoke test 3-country imports.
