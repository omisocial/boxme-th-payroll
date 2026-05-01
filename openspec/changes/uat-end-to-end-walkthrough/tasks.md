# Implementation Checklist — UAT End-to-End Walkthrough

## Phase 1 — Bulk worker import (Workers tab)

- [x] 1.1 Add `BulkImportWorkersModal` component in `webapp/src/components/workers/`
  - File picker (`.xlsx` only)
  - Parse Members sheet via `XLSX.read` (cols: B=fullName, C=nickname, D=phone, E=bankAccount, F=bankCode, H=department, I=startDate per `parser.ts`)
  - Show parsed rows in a table preview (warehouse selector at top)
- [x] 1.2 "Import All" handler — serial POST to `/api/workers` per row, show running progress (`X / N done, Y errors`), collect errors per row
- [x] 1.3 Generate worker `code` field — use slugified nickname or fallback `EMP-####` sequential (codes are required, not in Members sheet)
- [x] 1.4 Wire button in `WorkersPage.tsx` toolbar, refresh worker list on close
- [ ] 1.5 Verify: import `Thailand_Sessonal_Payment.xlsx` → all Members rows appear in workers list with `name_local`, `bank_code`, `bank_account` populated

## Phase 2 — Server-side attendance import (Payroll tab)

- [x] 2.1 Modify `App.tsx` to retain the raw `ArrayBuffer` after parse (`rawFileRef` added)
- [x] 2.2 Add "Save to DB" button to `Toolbar.tsx` props, render only when workbook loaded
- [x] 2.3 New `ServerImportDialog` component in `webapp/src/components/`
  - Warehouse dropdown (use `useWarehouses`)
  - yearMonth input (default `2026-04`)
  - "Upload & Preview" button → multipart POST to `/api/attendance/import?warehouse=...&yearMonth=...`
- [x] 2.4 Show preview after upload (rows count, sample 5 rows from `data.rows`)
- [x] 2.5 "Commit" button → POST `/api/attendance/import/commit` → result panel
- [ ] 2.6 Verify: upload xlsx → preview shows correct workDate values → commit returns `imported > 0, skipped = 0`

## Phase 3 — UAT walkthrough (no code changes)

- [ ] 3.1 Login as `admin@boxme.tech` → confirm Admin tab visible, Periods/Workers tabs render
- [ ] 3.2 Login as `th.hr@boxme.tech` → run Phase 1 (bulk import workers) → verify count
- [ ] 3.3 Same session → Payroll tab → upload xlsx → run Phase 2 (server import) → commit
- [ ] 3.4 Periods tab → "New Period" → name `April 2026`, dates `2026-04-01` → `2026-04-30`, country `TH` → create
- [ ] 3.5 Click into period detail → Lock (verify aggregation populates `payroll_period_lines`) → stats panel shows worker count + total net pay
- [ ] 3.6 Login as `admin@boxme.tech` → same period → Approve
- [ ] 3.7 Login as `th.hr@boxme.tech` → period detail → Export Bank CSV → Download → open CSV in Excel, verify column headers + non-zero net pay totals
- [ ] 3.8 Final SQL sanity check in Supabase SQL Editor:
  ```sql
  SELECT status FROM payroll_periods WHERE name = 'April 2026';  -- should be 'exported'
  SELECT COUNT(*), SUM(net_pay_thb) FROM payroll_period_lines WHERE period_id = '<id>';
  SELECT filename, total_thb, row_count FROM bank_exports WHERE period_id = '<id>';
  ```

## Verification gates between phases

- After Phase 1: workers visible in UI AND `SELECT COUNT(*) FROM workers WHERE country_code='TH'` matches.
- After Phase 2: `attendance_records` rows have `worker_id IS NOT NULL` for matched names.
- After Phase 3: `bank_exports` has one row, downloadable CSV opens cleanly.

## Effort estimate

| Phase | Effort | Risk |
|-------|--------|------|
| 1 — Bulk worker import UI | 1.5 hr | Low — XLSX parsing well-understood |
| 2 — Server attendance import UI | 1.5 hr | Low — endpoints already tested |
| 3 — UAT walkthrough | 30 min | Medium — first real-data run, expect 1–2 fix-up issues |
