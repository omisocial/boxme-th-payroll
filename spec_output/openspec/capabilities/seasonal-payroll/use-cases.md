# Use Cases & User Flows

## UC-1 — HR Admin imports the daily timesheet from Excel

**Actor**: `hr_admin` or `hr_payroll`

**Trigger**: End of working day; the supervisor sends today's `วันที่ X.xlsx` (or shares the existing workbook).

**Pre-conditions**:
- Workers in today's sheet exist in `workers`. New walk-in DW workers must first be created via UC-3.
- Active `rate_configs` covers `work_date`.

**Flow**:
1. HR navigates to "Import Timesheet" page.
2. Drag-drops the workbook file. Selects sheet name (auto-detected from `วันที่ X` pattern).
3. System parses rows 9+. Generates a preview with:
   - Matched rows (worker resolved, dept normalized, shift recognized) — green.
   - Warnings (typo match like `Bm1`→`BM1`, ambiguous full name) — yellow.
   - Errors (worker not found, shift not recognized, time impossible) — red.
4. HR resolves warnings/errors inline (pick the right worker, fix typos).
5. HR clicks "Confirm Import" → creates `attendance_records` rows + automatically computes `payroll_daily`.
6. Audit log records the import event with file hash.

**Post-conditions**:
- One `attendance_records` row per (worker, work_date, shift_code) with status `pending`.
- Computed `payroll_daily` snapshot.

**Exception**: Re-import of same day file — system detects via hash and asks for confirmation; on confirm, treats as edit (preserves history).

## UC-2 — Supervisor enters timesheet manually (offline app fallback)

**Actor**: `supervisor`

**Trigger**: Worker's mobile app failed (`โทรศัพท์เข้าแอปไม่ได้เช็คอิน`).

**Flow**:
1. Supervisor navigates to "Daily Timesheet" page filtered by today + shift.
2. Picks worker from dropdown (search by full name or worker_code).
3. Enters checkin and checkout times manually.
4. Sets `checkin_source = manual_supervisor`. Mandatory note field (free text).
5. Saves. Audit log captures supervisor's user_id.

**Post-condition**: Manual entry is flagged in the listing UI (icon) — HR can review and approve before period close.

## UC-3 — HR Admin enrolls a new walk-in DW worker

**Actor**: `hr_admin`

**Flow**:
1. "Add Worker" page — fields: full name, nickname, phone, dept, bank info, start_date.
2. System checks for duplicate full names — if found, asks "Same person or different?".
3. Creates worker with status `active`, generates next `worker_code`.
4. Worker is now eligible to appear in daily timesheet imports.

## UC-4 — Manager logs a damage incident

**Actor**: `manager` (warehouse manager)

**Trigger**: Worker damaged goods.

**Flow**:
1. Manager navigates to "Damage Log".
2. Picks worker → enters incident_date, total amount, cause (e.g. `แพ็คผิด`), warehouse.
3. Chooses deduction schedule:
   - **Single day**: full amount on next pay day.
   - **Multi-day split**: amount per day, end date.
4. System creates `damage_deductions` (header) + N `damage_deduction_schedule` rows.
5. On each scheduled date, when payroll runs for that day, the system applies deduction and updates schedule status.

**Post-conditions**:
- When fully applied, `damage_deductions.status = fully_deducted`.
- If worker resigns before fully applied → status becomes `written_off` (Q-19).

## UC-5 — Period close & approve

**Actor**: `hr_payroll` then `hr_admin`

**Flow**:
1. `hr_payroll` opens period detail page.
2. System lists all workers' `payroll_period_lines` with totals.
3. Reviewer can drill into each worker's daily breakdown to verify.
4. `hr_payroll` clicks "Lock for Review" → period.status = `locked_for_review`. No further attendance edits allowed without unlocking.
5. `hr_admin` reviews and clicks "Approve" → period.status = `approved`.
6. Audit log records both events with timestamps.

## UC-6 — Generate bank export files

**Actor**: `hr_admin` or `viewer_finance`

**Pre-condition**: period.status = `approved`.

**Flow**:
1. User selects period → "Generate Bank Files".
2. System groups workers by bank_code → produces N files (one per bank).
3. Each file uses the bank-specific adapter (see `api.md` §4).
4. User downloads files and submits to each bank's online portal.
5. After submission, user marks periods/lines as `paid`.

**Exception**: Workers with no bank account or invalid bank code — listed in a separate "Cash payouts" report.

## UC-7 — Monthly close & payroll dashboard

**Actor**: any authenticated user (with role-based filtering)

**Flow**:
1. User opens "Dashboard".
2. KPIs displayed: total gross THB, total OT THB, total deductions, # workers paid, # late, # damage incidents, bank-export status per bank.
3. Trend chart: gross THB by week (last 12 weeks).
4. Filters: department, period.
5. Click any KPI → drill-through to detailed list.

## UC-8 — Worker resigns

**Actor**: `hr_admin`

**Flow**:
1. HR sets `workers.status = resigned`, `end_date = today`.
2. System checks: any open `damage_deductions` for this worker?
   - If YES — modal: "Worker has 1,030.05 THB unpaid damage. Action?" with options:
     - Mark as written_off
     - Send to collections (out of scope; just logs intent)
     - Apply to final payroll if scheduled before `end_date`
3. System checks: any pending attendance records after `end_date` — block, ask HR to reconcile.

## UC-9 — Audit query: who edited this attendance record?

**Actor**: `hr_admin`

**Flow**:
1. From an attendance record's detail page, click "View History".
2. System shows audit log timeline: insert, each update (with diff), approval, etc.
3. Each event shows actor (full name + role), timestamp, change diff.

---

## Process diagrams (textual)

### Period close lifecycle

```
[open] ──supervisor enters timesheets──> [open]
   │
   │── hr_payroll: "Lock for review"
   ▼
[locked_for_review] ──hr_admin reviews──> [locked_for_review]
   │
   │── hr_admin: "Approve"
   ▼
[approved] ──hr generates bank files──> [exported]
   │
   │── (after bank confirms)
   ▼
(period_lines marked paid)
```

### Damage deduction lifecycle

```
created (status=pending, schedule=N rows)
   │
   │── as each scheduled deduction is applied during payroll compute
   ▼
partially_deducted
   │
   │── all schedule rows applied
   ▼
fully_deducted

OR:
created → worker resigns → written_off (manual decision)
```
