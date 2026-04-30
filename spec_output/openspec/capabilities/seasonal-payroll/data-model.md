# Data Model — Supabase Schema

> All assumptions tied to **Audit Checklist Q-X** must be confirmed before any DDL is finalized. Treat this file as a draft.

## Entity Map

```
                ┌──────────────┐
                │ departments  │  (BM1, DW1, แม่บ้าน, นักศึกษา …)
                └──────┬───────┘
                       │
                       │ FK
                       ▼
┌──────────────┐   ┌──────────────┐    ┌────────────────┐
│   workers    │◀──┤ rate_configs │    │     shifts     │
└──────┬───────┘   │ (versioned)  │    │ (08:30-17:30…) │
       │           └──────────────┘    └────────┬───────┘
       │                                        │
       │ FK (worker_id)                         │ FK (shift_code)
       ├────────────────────────────────────────┤
       ▼                                        ▼
┌────────────────────────────────────────────────────┐
│        attendance_records (one per worker-day)     │
└────────┬───────────────────────────────────────────┘
         │ FK
         ▼
┌────────────────────────────────────────────────────┐
│              payroll_daily (computed)              │
└────────┬───────────────────────────────────────────┘
         │ FK
         ▼
┌────────────────────────────────────────────────────┐
│        payroll_periods (aggregation by period)     │
└────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│       damage_deductions             │ ──── FK ───▶ workers
│ (multi-row schedule per incident)   │
└─────────────────────────────────────┘
```

---

## 1. `departments`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `code` | `text` | PRIMARY KEY | E.g. `BM1`, `DW1`, `แม่บ้าน`, `นักศึกษา` |
| `name_th` | `text` | NOT NULL | Thai display name |
| `name_en` | `text` | NULL OK | |
| `category` | `text` | CHECK ∈ (`boxme_staff`, `daily_worker`, `housekeeper`, `intern`) | Drives behavior (late penalty applies only to `boxme_staff` & `daily_worker`) |
| `late_penalty_applies` | `bool` | NOT NULL DEFAULT TRUE | Derived from category but explicit for override |
| `active` | `bool` | NOT NULL DEFAULT TRUE | |
| `created_at`, `updated_at` | `timestamptz` | | |

**Audit ref**: Q-3 (which codes are active), Q-7 (late-penalty rule).

---

## 2. `shifts`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `code` | `text` | PRIMARY KEY | E.g. `S0830`, `S0700`, `N1700` |
| `display_name` | `text` | NOT NULL | E.g. `08:30 - 17:30` (matches Excel) |
| `start_time` | `time` | NOT NULL | |
| `end_time` | `time` | NOT NULL | |
| `crosses_midnight` | `bool` | NOT NULL | Computed: TRUE if `end_time < start_time` |
| `standard_minutes` | `int` | NOT NULL | Used by wage_per_minute formula |
| `unpaid_break_minutes` | `int` | NOT NULL DEFAULT 0 | If team confirms break deduction (Q-11) |
| `active` | `bool` | NOT NULL DEFAULT TRUE | |

**Audit ref**: Q-9, Q-10, Q-11.

---

## 3. `rate_configs` (versioned)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | |
| `department_code` | `text` | FK → departments | NULL ⇒ default applies |
| `daily_rate_thb` | `numeric(10,2)` | NOT NULL | E.g. 500.00 |
| `ot_multiplier` | `numeric(4,2)` | NOT NULL DEFAULT 1.5 | Per Thai labor law for weekday OT |
| `ot_multiplier_holiday` | `numeric(4,2)` | NULL | Confirm with team (Q-16) |
| `ot_min_unit_minutes` | `int` | NOT NULL DEFAULT 30 | Confirm (Q-18) |
| `late_buffer_minutes` | `int` | NOT NULL DEFAULT 0 | Confirm (Q-5) |
| `late_rounding_unit` | `int` | NOT NULL DEFAULT 1 | 1=no rounding, 5=round up to 5 min, 15=round up to 15 min |
| `effective_from` | `date` | NOT NULL | |
| `effective_to` | `date` | NULL | NULL ⇒ current |
| `created_by` | `uuid` | FK → auth.users | |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() | |

**Audit ref**: Q-1, Q-2 (rates per dept), Q-5, Q-6, Q-16, Q-18, Q-35, Q-36.

**Resolution rule**: Look up the rate by `(department_code, work_date)` returning the row whose `effective_from <= work_date AND (effective_to IS NULL OR effective_to >= work_date)`. If no department-specific row, fall back to `department_code IS NULL` default.

---

## 4. `workers`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | Internal ID |
| `worker_code` | `text` | UNIQUE NOT NULL | Stable human-friendly code, e.g. `W-2026-0001` |
| `full_name_th` | `text` | NOT NULL | PII — encrypt |
| `nickname_th` | `text` | NULL OK | NOT unique (collisions exist) |
| `phone` | `text` | NULL OK | PII — encrypt; mask in UI |
| `bank_code` | `text` | NULL OK | Lookup table or string |
| `bank_account_no` | `text` | NULL OK | PII — encrypt |
| `national_id_hash` | `text` | UNIQUE NULL OK | SHA-256 of Thai ID (if collected) — **never store plaintext** |
| `department_code` | `text` | FK → departments | Current dept |
| `start_date` | `date` | NULL OK | |
| `end_date` | `date` | NULL OK | NULL ⇒ active |
| `status` | `text` | CHECK ∈ (`active`, `on_leave`, `resigned`) | |
| `created_at`, `updated_at` | `timestamptz` | | |

**Audit ref**: Q-25 (canonical identity), Q-32 (PII handling).

**RLS**: HR sees full record; supervisor sees `worker_code`, name, dept; viewer sees `worker_code` only.

---

## 5. `attendance_records`

One row per `(worker_id, work_date, shift_code)`. Multiple shifts per day allowed (some workers do morning + night).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY | |
| `worker_id` | `uuid` | FK → workers, NOT NULL | |
| `work_date` | `date` | NOT NULL | Calendar date of shift start |
| `shift_code` | `text` | FK → shifts, NOT NULL | |
| `checkin_at` | `timestamptz` | NULL OK | NULL = absent |
| `checkout_at` | `timestamptz` | NULL OK | NULL = forgot to clock out |
| `checkin_source` | `text` | CHECK ∈ (`mobile_app`, `manual_supervisor`, `wms_api`) | Audit |
| `checkin_entered_by` | `uuid` | FK → auth.users NULL OK | NULL if app-driven |
| `checkout_source`, `checkout_entered_by` | similar | | |
| `note` | `text` | NULL OK | Free text — `ลาป่วย`, `OT 1.5`, etc. |
| `note_classified` | `text` | CHECK ∈ (`none`, `sick`, `personal_leave`, `medical`, `app_failure`, `half_day_morning`, `half_day_afternoon`) | Mapped from note (with manual override) |
| `ot_before_hours` | `numeric(4,2)` | NOT NULL DEFAULT 0 | |
| `ot_after_hours` | `numeric(4,2)` | NOT NULL DEFAULT 0 | |
| `damage_amount_thb` | `numeric(10,2)` | NOT NULL DEFAULT 0 | Rolled-up from damage schedule for this date |
| `other_deduction_thb` | `numeric(10,2)` | NOT NULL DEFAULT 0 | Pending def (Q-15) |
| `status` | `text` | CHECK ∈ (`pending`, `approved`, `paid`, `disputed`) | |
| `created_at`, `updated_at` | `timestamptz` | | |
| **UNIQUE** `(worker_id, work_date, shift_code)` | | | Prevent dup |

**Indexes**:
- `(work_date)`
- `(worker_id, work_date)`
- `(status)`

**Audit ref**: Q-22, Q-23, Q-24.

---

## 6. `payroll_daily` (computed snapshot)

Materialized per-day computation. Re-derived from `attendance_records` + `rate_configs` snapshot at compute time.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `attendance_id` | `uuid` | FK → attendance_records, UNIQUE |
| `worker_id` | `uuid` | denorm |
| `work_date` | `date` | denorm |
| `daily_rate_thb` | `numeric(10,2)` | snapshot from rate_configs at compute time |
| `hours_bucket` | `int` | 5 or 8 (per current Excel logic — confirm Q-9) |
| `wage_per_minute_thb` | `numeric(10,4)` | |
| `late_minutes` | `numeric(8,2)` | |
| `late_minutes_deducted` | `numeric(8,2)` | 0 if dept exempt |
| `late_deduction_thb` | `numeric(10,2)` | |
| `early_out_minutes` | `numeric(8,2)` | |
| `early_out_deduction_thb` | `numeric(10,2)` | |
| `ot_total_hours` | `numeric(4,2)` | |
| `ot_pay_thb` | `numeric(10,2)` | |
| `damage_deduction_thb` | `numeric(10,2)` | |
| `other_deduction_thb` | `numeric(10,2)` | |
| `gross_wage_thb` | `numeric(10,2)` | = daily_rate − late_ded − early_ded − damage − other + OT_pay (NEVER negative — see Q-19) |
| `computed_at` | `timestamptz` | |
| `rate_config_id` | `uuid` | FK → rate_configs (snapshot) |

**Idempotent**: re-computing for the same `attendance_id` overwrites the row.

---

## 7. `damage_deductions`

One row per **damage incident** (NOT per deduction event).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `worker_id` | `uuid` | FK → workers | |
| `incident_date` | `date` | NULL OK | When the damage occurred |
| `total_amount_thb` | `numeric(10,2)` | NOT NULL | E.g. 913.82 |
| `cause` | `text` | NULL OK | E.g. `แพ็คผิด` |
| `warehouse_id` | `text` | NULL OK | `1`, `2`, … (Q-20) |
| `status` | `text` | CHECK ∈ (`pending`, `partially_deducted`, `fully_deducted`, `written_off`) | |
| `notes` | `text` | NULL OK | Free-form |
| `created_at`, `updated_at` | `timestamptz` | | |

### `damage_deduction_schedule`

Many-to-one with `damage_deductions` — one row per "deduct X THB on date Y" event.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `damage_id` | `uuid` | FK → damage_deductions |
| `scheduled_date` | `date` | NOT NULL |
| `amount_thb` | `numeric(10,2)` | NOT NULL |
| `actually_deducted_amount_thb` | `numeric(10,2)` | NULL until applied |
| `actually_deducted_date` | `date` | NULL until applied |
| `attendance_id` | `uuid` | FK → attendance_records (set when applied) |

**Audit ref**: Q-19, Q-20, Q-21.

**Constraint**: `SUM(schedule.amount_thb WHERE damage_id=X) = damage_deductions(X).total_amount_thb`.

---

## 8. `payroll_periods`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `period_label` | `text` | E.g. `2026-04` (monthly) or `2026-W17` (weekly) |
| `period_type` | `text` | CHECK ∈ (`weekly`, `biweekly`, `monthly`) |
| `start_date` | `date` | |
| `end_date` | `date` | |
| `status` | `text` | CHECK ∈ (`open`, `locked_for_review`, `approved`, `exported`) |
| `total_workers` | `int` | |
| `total_gross_thb` | `numeric(14,2)` | |
| `total_deductions_thb` | `numeric(14,2)` | |
| `total_net_thb` | `numeric(14,2)` | |
| `created_at`, `closed_at` | `timestamptz` | |

### `payroll_period_lines` (worker × period)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `period_id` | `uuid` | FK |
| `worker_id` | `uuid` | FK |
| `total_gross_thb` | `numeric(10,2)` | sum of payroll_daily.gross_wage |
| `total_ot_thb` | `numeric(10,2)` | |
| `total_late_deduction_thb` | `numeric(10,2)` | |
| `total_early_out_deduction_thb` | `numeric(10,2)` | |
| `total_damage_deduction_thb` | `numeric(10,2)` | |
| `bank_payment_status` | `text` | CHECK ∈ (`unpaid`, `exported`, `paid`, `failed`) |
| `bank_export_file_id` | `uuid` | FK → bank_exports |

---

## 9. `bank_exports`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `period_id` | `uuid` | FK |
| `bank_code` | `text` | E.g. `K-BANK` |
| `file_format_version` | `text` | bank-specific |
| `file_url` | `text` | Object storage |
| `total_amount_thb` | `numeric(14,2)` | |
| `record_count` | `int` | |
| `exported_by` | `uuid` | FK auth.users |
| `exported_at` | `timestamptz` | |
| `bank_response` | `text` | success/failure log |

---

## 10. `audit_log`

Standard audit trail.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `actor_user_id` | `uuid` | FK auth.users |
| `actor_role` | `text` | snapshot at action time |
| `entity_type` | `text` | e.g. `attendance_records` |
| `entity_id` | `uuid` | |
| `action` | `text` | `insert` / `update` / `delete` / `view_pii` |
| `before` | `jsonb` | |
| `after` | `jsonb` | |
| `at` | `timestamptz` | |

**Required for**: any change to attendance_records, damage_deductions, rate_configs, worker bank_account_no.

---

## RLS Policy Summary

| Role | workers | attendance | rate_configs | damage | payroll_daily | bank_exports |
|---|---|---|---|---|---|---|
| `hr_admin` | RW (all fields) | RW | RW | RW | R | RW |
| `hr_payroll` | RW (no bank/ID after lock) | RW | R | R | R | RW |
| `manager` | R (masked PII) | RW for own dept | R | RW for own dept | R for own dept | — |
| `supervisor` | R (masked PII, own shift only) | RW for own shift | — | R | — | — |
| `viewer_finance` | R (masked PII) | R | R | R | R | RW |

**Audit ref**: Q-32, Q-33.
