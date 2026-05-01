# API & Integration Surface

> Endpoint shapes are illustrative. All ⚠️ items remain blocked on Audit Checklist responses or sample-file delivery.

## 1. Internal REST API (Supabase Edge Functions or PostgREST)

### 1.1 Worker management

```
GET    /api/workers?dept=BM1&status=active&q=ธัญ
GET    /api/workers/{id}
POST   /api/workers
PATCH  /api/workers/{id}
DELETE /api/workers/{id}      -- soft delete (set status=resigned, end_date=today)

GET    /api/workers/{id}/timesheets?from=2026-04-01&to=2026-04-30
GET    /api/workers/{id}/payroll/{period_id}
```

### 1.2 Department / shift / rate config

```
GET    /api/departments
POST   /api/departments
PATCH  /api/departments/{code}

GET    /api/shifts
POST   /api/shifts
PATCH  /api/shifts/{code}

GET    /api/rate-configs?dept=BM1&date=2026-04-15  -- resolves effective rate
POST   /api/rate-configs                           -- creates new effective_from row
```

### 1.3 Daily timesheet / attendance

```
GET    /api/attendance?date=2026-04-30&dept=BM1&status=pending
POST   /api/attendance                            -- one record
POST   /api/attendance/bulk                        -- batch import (Excel)
PATCH  /api/attendance/{id}
DELETE /api/attendance/{id}                        -- soft delete via status

POST   /api/attendance/{id}/approve
POST   /api/attendance/{id}/dispute

# Recompute payroll_daily for an attendance row (idempotent)
POST   /api/attendance/{id}/compute
```

### 1.4 Damage deductions

```
GET    /api/damages?worker_id=...&status=pending
POST   /api/damages
POST   /api/damages/{id}/schedule          -- add scheduled deduction event
PATCH  /api/damages/{id}                   -- e.g., status → written_off
GET    /api/damages/{id}/schedule          -- list deduction schedule
PATCH  /api/damages/{id}/schedule/{sid}    -- mark applied / change date
```

### 1.5 Period close & bank export

```
POST   /api/periods                        -- create period
GET    /api/periods?status=open
POST   /api/periods/{id}/lock              -- transitions to locked_for_review
POST   /api/periods/{id}/approve           -- requires HR role
POST   /api/periods/{id}/export?bank=K-BANK
GET    /api/periods/{id}/exports           -- list of bank export files
GET    /api/bank-exports/{id}/download     -- streamed file download (signed URL)
```

### 1.6 Reporting

```
GET    /api/reports/period-summary/{period_id}
GET    /api/reports/worker-attendance?worker_id=...&from=...&to=...
GET    /api/reports/late-leaderboard?period_id=...
GET    /api/reports/ot-leaderboard?period_id=...
GET    /api/reports/damage-summary?period_id=...
```

---

## 2. Excel import endpoint (preserves current team workflow)

```
POST /api/import/excel-daily-timesheet
  multipart: file=<.xlsx>, work_date=2026-04-30, sheet_name="วันที่ 30"

response:
{
  "preview_id": "uuid",
  "rows_parsed": 87,
  "warnings": [
    { "row": 14, "type": "name_match", "message": "Worker 'ธัญ ...' has 7 candidates — pick one", "candidates": [...] },
    { "row": 22, "type": "shift_unknown", "message": "Shift '08:30 - 17:30 ' (trailing space) → mapped to S0830" }
  ],
  "errors": [ ... ]
}

POST /api/import/excel-daily-timesheet/{preview_id}/confirm
```

The import must:
1. Parse rows 9+ from the Thai-named sheet.
2. Resolve `B (full name)` to `worker_id` — flag ambiguities (Q-25); never auto-create new workers (require HR confirmation).
3. Resolve `E (Note)` to `department_code` — auto-correct case (`Bm1` → `BM1`) and typo-distance match (`แมบ้าน` → `แม่บ้าน`).
4. Capture `K (manual note)` and classify into `note_classified`.
5. Read OT cells `AC`/`AE` (numeric hours).
6. Read `AI` (damage); if present, expect a matching open `damage_deductions` row — surface mismatches.
7. Compute `payroll_daily` rows on confirm.

---

## 3. Boxme WMS API integration ⚠️ Q-27

> **Blocked**: We need WMS API documentation. Until then this section is a placeholder.

Expected flow (proposed):
1. Webhook from WMS on each worker check-in event:
   ```
   POST /api/webhooks/wms-checkin
     { worker_external_id, event_type: 'checkin'|'checkout', timestamp, location_id }
   ```
2. Map `worker_external_id` → internal `workers.id` via a lookup table.
3. Upsert into `attendance_records` setting `checkin_source = 'wms_api'`.

Authentication: shared HMAC secret with WMS. Replay protection via timestamp + nonce.

---

## 4. Bank export — file format ⚠️ Q-28

For each bank we need a sample file. Until then, the spec describes a **generic transformation** layer:

```
GET /api/periods/{id}/export?bank={code}
```

Each bank has a **format adapter**:

```
interface BankFormatAdapter {
    bank_code: string
    file_extension: '.csv' | '.txt' | '.xlsx'
    field_separator: ',' | '|' | tab
    record_layout: list of (field_name, source_column, formatter)
    header_layout: optional fixed header
    footer_layout: optional fixed footer (e.g., total amount, record count)
    file_naming: template (e.g., "PAYROLL_KBANK_{period_label}_{YYYYMMDD}_{seq}.txt")
    encoding: 'UTF-8' | 'TIS-620' | ...
}
```

| Bank | Adapter status |
|---|---|
| K-BANK | Sample file requested (Q-28) |
| SCB | Sample file requested |
| BBL | Sample file requested |
| KTB | Sample file requested |
| BAY | Sample file requested |
| GSB | Sample file requested |
| TTB | Sample file requested |
| KKP | Sample file requested |
| BAAC | Sample file requested |
| UOB | Sample file requested |

**Common fields** (best-guess across Thai banks):
- account number (target)
- account name (display)
- amount (THB, no separator, 2 decimals)
- reference / transaction note
- our (originator) account number
- effective transfer date

---

## 5. Authentication

- Supabase Auth (email + password OR SSO).
- Roles defined in `app_roles` table; assigned via `user_roles` (m:n).
- All API routes require `Authorization: Bearer <jwt>` (Supabase JWT).
- RLS enforced at DB level (see `data-model.md` §RLS).

## 6. Rate limits & abuse

| Endpoint | Limit |
|---|---|
| `POST /api/import/...` | 10 / hour / user |
| `POST /api/periods/{id}/export` | 5 / hour / user |
| `GET /api/workers` | 60 / minute |
| `POST /api/attendance/bulk` | 5 / hour |

## 7. Webhooks (outbound)

The system can emit webhooks on events:
- `period.locked`, `period.approved`, `period.exported`
- `attendance.disputed`, `attendance.approved`
- `damage.created`, `damage.fully_deducted`

Useful for Slack/Line notifications to managers.

## 8. Audit log API (read-only)

```
GET /api/audit?entity=attendance_records&entity_id={uuid}
GET /api/audit?actor_user_id={uuid}&from=...&to=...
```

PII access (`view_pii` action) is logged but only readable by `hr_admin`.
