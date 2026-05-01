# Implementation Checklist

## Phase 1 — Core Refactor (frontend-first, no DB migration required yet)

- [ ] 1.1 Remove **Periods** tab from nav; keep `PeriodsPage` file but unmount
- [ ] 1.2 Create `webapp/src/app/Router.tsx` and `webapp/src/app/AppShell.tsx`; reduce `App.tsx` to `<AppShell><Router/></AppShell>`
- [ ] 1.3 Create `webapp/src/context/WarehouseContext.tsx` skeleton (current warehouse + accessible list, defaults to user's `country_scope`)
- [ ] 1.4 Create `webapp/src/context/ConfigContext.tsx` skeleton (caches `EngineConfig`, exposes `useEngineConfig()`)
- [ ] 1.5 Extend `shared/types/payroll.ts` `EngineConfig` with `currency`, `deptKeywords`, `paidLeaveKeywords`, `manualCheckinKeywords`
- [ ] 1.6 Refactor `webapp/src/payroll/engine.ts`: keep `BUILT_IN_TH_CONFIG` as fallback only; export `computePayroll(row, config)` requiring full config; pull keywords from config not hardcoded
- [ ] 1.7 Wire `PayrollPage` to read engine config from `ConfigContext` (default TH for now)
- [ ] 1.8 Create `webapp/src/features/payroll/PayrollBadges.tsx` — displays pending-workers count, OT-outlier count, totals; render above `WorkerTable`
- [ ] 1.9 Detect "new workers in attendance not yet in DB" client-side after parse → expose count via badge with link to Workers page
- [ ] 1.10 Verify: `npm run build` passes; manual smoke test: upload TH file → see badges → export Daily/Workers/Bank

## Phase 2 — Multi-warehouse + Auth (DB migration required)

- [ ] 2.1 Migration `010_user_warehouses.sql` (M:N user↔warehouse)
- [ ] 2.2 Migration `011_workers_pending_status.sql` (`pending_update` enum + `created_via`)
- [ ] 2.3 Migration `008_engine_configs.sql`
- [ ] 2.4 Backend `services/engine-config.ts` + endpoint `GET /api/engine-config`
- [ ] 2.5 Backend `services/worker-resolver.ts` + endpoint `POST /api/workers/resolve` (returns existing or creates pending)
- [ ] 2.6 Frontend warehouse switcher in `AppShell` header
- [ ] 2.7 Backend middleware `requireWarehouseAccess`
- [ ] 2.8 Workers page: `pending_update` filter chip with badge
- [ ] 2.9 Settings page: Engine Config editor (CRUD `rate_configs`)

## Phase 3 — i18n + Multi-currency + Excel Templates

- [ ] 3.1 Migration `009_excel_templates.sql` + seed TH template
- [ ] 3.2 Refactor `parser.ts` to accept template (sheet/column aliases)
- [ ] 3.3 Create `webapp/src/lib/currency.ts` — format per `countries.currency_symbol` + `locale`
- [ ] 3.4 Audit all `฿` / hardcoded currency strings; replace with `formatCurrency()`
- [ ] 3.5 Split i18n dict into `i18n/dict/{en,vi,th}.ts` files; add namespaces
- [ ] 3.6 Add new keys for warehouse picker, badges, settings
- [ ] 3.7 Seed VN + PH (countries, warehouses, rate_configs, excel_templates)
- [ ] 3.8 Backend `services/formula-evaluator.ts` for `pay_components.formula_type='expression'`
- [ ] 3.9 Settings: Excel Template editor + Bank Template editor

## Phase 4 — Polish

- [ ] 4.1 `payroll_daily.engine_config_snapshot JSON` audit trail
- [ ] 4.2 Responsive review (mobile header dropdown, table → card)
- [ ] 4.3 Playwright E2E for import → compute → export across 3 countries
- [ ] 4.4 PDF payslip per worker (optional)
