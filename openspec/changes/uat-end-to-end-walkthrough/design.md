# Design: UAT End-to-End Walkthrough

## Goal

Walk the full payroll flow with real Thailand seasonal data, from worker seeding through bank export, on the live deployment.

## Context & Technical Approach

The MVP v0.2 backend is complete and deployed. Two UI gaps prevent UAT today:

1. **Workers tab** has only single-record CRUD — manually entering ~50+ workers from `Thailand_Sessonal_Payment.xlsx` (Members sheet) is tedious and error-prone.
2. **Excel attendance import has no UI** — `POST /api/attendance/import` and `/import/commit` exist server-side, but the Payroll tab's Uploader still does local-parse-only, never writing to DB. Period lock/approve/export reads from `attendance_records` in DB, so attendance must be server-imported.

We close both gaps with **one shared bulk-upload pattern** reused in two tabs, then run the UAT.

### Architecture decision

**Option A — Build the UI properly (recommended):**
Add a "Bulk Upload" button with file picker on both the Workers tab (parses Members sheet → POSTs to `/api/workers` per row) and the Payroll tab (uploads file directly to `/api/attendance/import`, shows preview, commits). Reusable for monthly ops.

**Option B — One-off SQL seed + curl:**
Generate `INSERT INTO workers` SQL from the xlsx via a script, run in Supabase SQL Editor. Use `curl` for attendance import. Faster for first UAT but unusable for normal workflow.

**Recommendation:** Option A. The bulk-upload UI is needed anyway for monthly payroll ops, and the work is small (~150 LOC total). UAT becomes a clean repeatable demo.

### Data flow (Option A)

```
┌─────────────────────┐
│ 1. Workers Tab      │  reads Members sheet (xlsx) locally
│   "Bulk Import" btn │  → POSTs each row to /api/workers (skip on duplicate code)
│                     │  → progress bar, errors list
└─────────────────────┘
          ↓
┌─────────────────────┐
│ 2. Payroll Tab      │  uploads xlsx to server
│   "Save to DB" btn  │  → POST /api/attendance/import?warehouse=...&yearMonth=YYYY-MM
│   (after parsing)   │  → preview modal → POST /api/attendance/import/commit
└─────────────────────┘
          ↓
┌─────────────────────┐
│ 3. Periods Tab      │  existing UI, no changes needed
│   create → lock     │
│   → approve         │
│   → export bank CSV │
└─────────────────────┘
```

## Proposed Changes

### `webapp/src/components/workers/WorkersPage.tsx`
- Add "Bulk Import" button next to "Add Worker"
- New `<BulkImportWorkersModal>` — file picker, parses `Members` sheet locally with existing `XLSX.read`, lists rows in a preview table, "Import All" button POSTs serially to `/api/workers` (skip on 409/duplicate code), shows progress + per-row error
- Reuses `parseWorkbook`'s Members parsing (extract just that section, since we don't need attendance)

### `webapp/src/components/Toolbar.tsx` (or new toolbar button on Payroll tab)
- Add "Save to DB" button visible only when a workbook is loaded
- Opens `<ServerImportDialog>` — warehouse dropdown (uses existing `useWarehouses`), yearMonth picker, "Upload" button
- POSTs the original ArrayBuffer (kept in App state) to `/api/attendance/import?warehouse=...&yearMonth=...` as multipart formdata
- On success, shows preview row count + "Commit" button → `POST /import/commit`
- App.tsx needs to retain `pendingBuffer.buf` in a stable ref even after parse completes (currently cleared)

### Backend — none required (endpoints already exist and work)

## Verification

1. **Workers seed:** Login as `th.hr@boxme.tech` → Workers tab → Bulk Import → upload `Thailand_Sessonal_Payment.xlsx` → verify N workers created in Workers list (should match Members sheet rows). Re-running should skip-not-error.
2. **Attendance import:** Payroll tab → upload xlsx (local parse as today) → "Save to DB" → pick warehouse + yearMonth `2026-04` → preview shows non-empty `workDate` for every row → Commit → API returns `{ imported: N, skipped: 0 }`.
3. **DB sanity (via Supabase SQL Editor):**
   ```sql
   SELECT COUNT(*) FROM attendance_records WHERE work_date >= '2026-04-01';
   SELECT COUNT(*) FROM attendance_records WHERE worker_id IS NOT NULL;  -- should be > 0
   SELECT COUNT(*) FROM payroll_daily;  -- 0 until period lock recomputes
   ```
4. **Period flow:** Periods tab → New Period (April 2026, 2026-04-01 to 2026-04-30) → click into detail → Lock (HR) → Approve (admin) → Export Bank CSV → Download. Verify CSV has rows × correct net pay totals.
5. **Bank CSV format:** Open downloaded CSV → confirm columns match `bank_export_templates.columns_json` for `K-BANK` → totals line up with summary stats shown in UI.

## Out of scope for this initiative

- Bulk worker editing (only bulk-create on first import)
- Damages sheet ingestion (separate spec — need `damages` table workflow)
- Multi-warehouse attendance in single file (current flow: one warehouse per upload)
- yearMonth auto-detection from xlsx filename (manual pick is fine for UAT)
