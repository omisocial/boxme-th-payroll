# Default Configurations / Cấu hình mặc định

> **Purpose**: Convert the 38 audit checklist questions into a **single config table** with TH defaults pre-filled. Thailand team only needs to override values that are wrong — they don't need to fill blanks. Boxme VN BA already provided sensible defaults inferred from the existing Excel and Thai labor law.
>
> **How this maps to the audit checklist**: Each row below cites the originating Q-N. Team confirms or overrides the default; if confirmed, no further action is needed.

## 1. Master config table

```sql
system_configs
├─ id                  UUID PK
├─ config_key          TEXT UNIQUE   -- 'th.late_buffer_minutes'
├─ scope               TEXT          -- 'global' | 'country:TH' | 'country:TH/warehouse:1'
├─ value               JSONB         -- typed value
├─ default_value       JSONB         -- the original seeded default
├─ description_local   TEXT
├─ description_en      TEXT
├─ data_type           TEXT          -- 'integer' | 'decimal' | 'boolean' | 'enum' | 'list' | 'time' | 'string'
├─ enum_options        JSONB NULL    -- if data_type = enum
├─ confirmed_by_team   BOOLEAN DEFAULT FALSE
├─ confirmed_at        TIMESTAMPTZ NULL
├─ confirmed_by        UUID NULL
├─ origin_audit_q      TEXT NULL     -- e.g. 'Q-5'
├─ updated_at          TIMESTAMPTZ
```

Admin UI groups by section; each row shows: key, current value, **default**, "use default" toggle, last edited by, originating audit question.

## 2. Pre-seeded TH defaults

### A. Daily rate & department (Q-1 to Q-4)

| config_key | default | description | from |
|---|---|---|---|
| `th.daily_rate_default_thb` | `500.00` | Default daily rate when no department-specific rate is set | Q-1 |
| `th.dept_rate_overrides` | `{}` (empty) | JSON `{dept_code: amount_thb}`; populate to differ from default | Q-2 |
| `th.active_department_codes` | `["BM1","BM3","DW1","DW3","แม่บ้าน","นักศึกษาฝึกงาน"]` | Active codes seen in Apr 2026 timesheets | Q-3 |
| `th.allow_unregistered_dw` | `true` | Whether DW workers can be added on-the-fly during import | Q-4 |
| `th.dw_auto_create_grade` | `"NEW"` | Default grade for auto-created DW workers | Q-4 |

### B. Time / late / early-leave (Q-5 to Q-11)

| config_key | default | description | from |
|---|---|---|---|
| `th.late_buffer_minutes` | `0` | Grace minutes; late ≤ this = no penalty | Q-5 |
| `th.late_rounding_unit_minutes` | `1` | Round late minutes UP to this unit (1=no rounding) | Q-6 |
| `th.late_penalty_applies_to` | `["BM*","DW*"]` | Department codes (glob patterns) that incur late penalty | Q-7 |
| `th.intern_daily_rate_thb` | `null` (= use default 500) | Specify if intern rate differs | Q-8 |
| `th.housekeeper_daily_rate_thb` | `null` (= use default 500) | | Q-8 |
| `th.hours_bucket_strategy` | `"excel_compat"` | enum: `excel_compat` (5 if ≤6h else 8), `actual_duration` (real hrs), `fixed_8` | Q-9 |
| `th.shifts` | (seeded list — see §B-shifts) | Catalogue of valid shifts | Q-10 |
| `th.unpaid_break_minutes` | `0` | Lunch break deducted from worked time | Q-11 |

#### B-shifts (seeded `shifts` rows)

| code | display | start | end | crosses_midnight |
|---|---|---|---|---|
| `S0830` | `08:30 - 17:30` | 08:30 | 17:30 | no |
| `S0700` | `07:00 - 16:00` | 07:00 | 16:00 | no |
| `S0900` | `09:00 - 18:00` | 09:00 | 18:00 | no |
| `N1700` | `17:00 - 02:00` | 17:00 | 02:00 | yes |

### C. Leave policy (Q-12 to Q-15)

| config_key | default | description | from |
|---|---|---|---|
| `th.sick_leave_paid` | `false` | Excel current behavior — treat as voluntary early-out | Q-12 |
| `th.sick_leave_paid_days_per_year` | `0` | If `sick_leave_paid` = true, max paid days/year | Q-12 |
| `th.half_day_pay_rule` | `"deduct_actual"` | enum: `deduct_actual` (current Excel: deduct minutes), `pay_50pct` (flat half-day), `pay_full_when_approved` | Q-13 |
| `th.personal_leave_paid` | `false` | | Q-14 |
| `th.column_aj_purpose` | `"unknown"` | Free text — team to fill what column AJ deducts | Q-15 |

### D. OT (Q-16 to Q-18)

| config_key | default | description | from |
|---|---|---|---|
| `th.ot_multiplier_weekday` | `1.5` | Standard weekday OT | Q-16 |
| `th.ot_multiplier_weekend` | `1.5` | Saturday OT (= weekday for warehouse work, configurable) | Q-16 |
| `th.ot_multiplier_holiday_regular` | `2.0` | Working on holiday — regular hours | Q-16 |
| `th.ot_multiplier_holiday_ot` | `3.0` | OT on top of holiday work | Q-16 |
| `th.ot_before_after_same_rule` | `true` | Whether OT before-shift and after-shift use identical multiplier | Q-17 |
| `th.ot_min_unit_minutes` | `30` | OT counted in 30-min increments (round UP) | Q-18 |
| `th.ot_min_chargeable_minutes` | `30` | OT under this duration = ignored | Q-18 |

### E. Damage deductions (Q-19 to Q-21)

| config_key | default | description | from |
|---|---|---|---|
| `th.damage_carryover_strategy` | `"carry_to_next_day"` | enum: `carry_to_next_day`, `cap_at_zero`, `allow_negative` | Q-19 |
| `th.damage_resigned_handling` | `"write_off"` | enum: `write_off`, `manual_review`, `send_to_collections` | Q-19 |
| `th.warehouse_codes` | `{"1":"TH-BKK-1","2":"TH-BKK-2"}` | Map Excel `คลังที่` numbers to warehouse codes | Q-20 |
| `th.damage_to_attendance_link` | `"manual"` | enum: `manual` (current), `auto_on_status_change` | Q-21 |

### F. Operational edge cases (Q-22 to Q-26)

| config_key | default | description | from |
|---|---|---|---|
| `th.manual_checkin_requires_approval` | `true` | Manual entries must be approved before period close | Q-22 |
| `th.manual_checkin_authorized_roles` | `["supervisor","hr_admin","hr_payroll"]` | | Q-22 |
| `th.missing_checkout_handling` | `"block_period_close"` | enum: `block_period_close`, `auto_zero`, `auto_use_shift_end` | Q-23 |
| `th.night_shift_late_logic` | `"compare_to_shift_start_modulo"` | enum (current Excel default) | Q-24 |
| `th.canonical_worker_id` | `"worker_code"` | enum: `worker_code` (system gen), `national_id_hash`, `phone` | Q-25 |
| `th.calendar_display_default` | `"buddhist"` | enum: `buddhist`, `gregorian` | Q-26 |
| `th.locale_default` | `"th-TH"` | | Q-26 |

### G. Integration (Q-27 to Q-31)

| config_key | default | description | from |
|---|---|---|---|
| `th.wms_api_enabled` | `false` | Disabled until API doc available | Q-27 |
| `th.wms_api_endpoint` | `null` | | Q-27 |
| `th.wms_api_auth_secret` | `null` | encrypted | Q-27 |
| `th.bank_export_format_versions` | (seeded per bank — see §G-banks) | Per-bank format strategy | Q-28 |
| `th.missing_day_treatment` | `"no_work"` | enum: `no_work`, `error`, `flag_for_review` | Q-29 |
| `th.use_legacy_result_sheet` | `false` | Excel Result sheet is broken; never use | Q-30 |
| `th.approval_flow` | `"single_step_hr_admin"` | enum (Q-31) | Q-31 |

#### G-banks

| code | format_default |
|---|---|
| `K-BANK` | `"file_pending_team"` |
| `SCB` | `"file_pending_team"` |
| `BBL` | `"file_pending_team"` |
| `KTB` | `"file_pending_team"` |
| `BAY` | `"file_pending_team"` |
| `GSB` | `"file_pending_team"` |
| `TTB` | `"file_pending_team"` |
| `KKP` | `"file_pending_team"` |
| `BAAC` | `"file_pending_team"` |
| `UOB` | `"file_pending_team"` |

### H. Privacy / RBAC / retention (Q-32 to Q-34)

| config_key | default | description | from |
|---|---|---|---|
| `th.pii_storage_strategy` | `"encrypted_at_rest"` | enum: `encrypted_at_rest`, `tokenized_pii_vault`, `hashed_only` | Q-32 |
| `th.bank_account_visible_roles` | `["hr_admin"]` | Other roles see masked | Q-32, Q-33 |
| `th.national_id_collected` | `false` | Whether to collect Thai ID at all | Q-32 |
| `th.audit_log_retention_years` | `7` | Per Thai accounting law | Q-34 |
| `th.attendance_retention_years` | `7` | | Q-34 |
| `th.bank_export_retention_years` | `7` | | Q-34 |

### I. Versioning (Q-35 to Q-36)

| config_key | default | description | from |
|---|---|---|---|
| `th.rate_change_history` | `[]` | Empty = no historic changes | Q-35 |
| `th.ot_multiplier_history` | `[]` | | Q-36 |

### J. Migration (Q-37 to Q-38)

| config_key | default | description | from |
|---|---|---|---|
| `th.migration_history_months` | `0` | 0 = start fresh from go-live | Q-37 |
| `th.parallel_run_months` | `1` | 1 month of running both Excel and system | Q-38 |

### K. Compensation system / Phase 2 (extends Q-39, Q-40, Q-41)

| config_key | default | description | from |
|---|---|---|---|
| `th.allowance_components_enabled` | `[]` | List of component codes to activate beyond base/OT | Q-39 (new) |
| `th.allowance_pay_on_partial_day` | `false` | Whether allowances pay if worker doesn't complete full shift | Q-40 (new) |
| `th.piece_rate_enabled` | `false` | If enabled, add `piece_rate` component | Q-41 (new) |

### L. Work-time limits (Q-42 to Q-44)

| config_key | default | description | from |
|---|---|---|---|
| `th.legal_limits_enforce` | `"warn"` | enum: `warn`, `block`, `disabled` | Q-42 |
| `th.boxme_internal_max_hrs_per_day` | `null` (= use legal) | If lower than legal, this wins | Q-44 |
| `th.boxme_internal_max_ot_per_week` | `null` (= use legal) | | Q-44 |

## 3. Confirmation workflow

1. After v0.2 spec hand-off, Thailand team reviews the **Defaults Confirmation Page** in admin UI.
2. For each config row: confirm OR override OR leave-as-default.
3. System tracks `confirmed_by_team`, `confirmed_at`, `confirmed_by`.
4. Period close is blocked until **all** §A–§D rows are either confirmed or overridden (the rest can use defaults indefinitely).

This keeps the workflow simple: team only touches what they care about, defaults handle the rest.

## 4. Why store defaults in a table (not env vars / code constants)?

- Multi-country: each country has different defaults; can't be code constants.
- Audit trail: every change to a config is in `audit_log`.
- Time-travel: configs can have `effective_from` for retroactive computation.
- Self-service: HR can change a multiplier without engineering deploy.

## 5. Audit checklist → config map (quick lookup)

| Audit Q | Config key(s) |
|---|---|
| Q-1 | `th.daily_rate_default_thb` |
| Q-2 | `th.dept_rate_overrides` |
| Q-3 | `th.active_department_codes` |
| Q-4 | `th.allow_unregistered_dw`, `th.dw_auto_create_grade` |
| Q-5 | `th.late_buffer_minutes` |
| Q-6 | `th.late_rounding_unit_minutes` |
| Q-7 | `th.late_penalty_applies_to` |
| Q-8 | `th.intern_daily_rate_thb`, `th.housekeeper_daily_rate_thb` |
| Q-9 | `th.hours_bucket_strategy` |
| Q-10 | seeded `shifts` table |
| Q-11 | `th.unpaid_break_minutes` |
| Q-12 | `th.sick_leave_paid`, `th.sick_leave_paid_days_per_year` |
| Q-13 | `th.half_day_pay_rule` |
| Q-14 | `th.personal_leave_paid` |
| Q-15 | `th.column_aj_purpose` |
| Q-16 | `th.ot_multiplier_*` |
| Q-17 | `th.ot_before_after_same_rule` |
| Q-18 | `th.ot_min_unit_minutes`, `th.ot_min_chargeable_minutes` |
| Q-19 | `th.damage_carryover_strategy`, `th.damage_resigned_handling` |
| Q-20 | `th.warehouse_codes` |
| Q-21 | `th.damage_to_attendance_link` |
| Q-22 | `th.manual_checkin_*` |
| Q-23 | `th.missing_checkout_handling` |
| Q-24 | `th.night_shift_late_logic` |
| Q-25 | `th.canonical_worker_id` |
| Q-26 | `th.calendar_display_default`, `th.locale_default` |
| Q-27 | `th.wms_api_*` |
| Q-28 | `th.bank_export_format_versions` |
| Q-29 | `th.missing_day_treatment` |
| Q-30 | `th.use_legacy_result_sheet` |
| Q-31 | `th.approval_flow` |
| Q-32 | `th.pii_storage_strategy`, `th.national_id_collected` |
| Q-33 | `th.bank_account_visible_roles` |
| Q-34 | `th.*_retention_years` |
| Q-35 | `th.rate_change_history` |
| Q-36 | `th.ot_multiplier_history` |
| Q-37 | `th.migration_history_months` |
| Q-38 | `th.parallel_run_months` |
| Q-42 | `th.legal_limits_enforce` |
| Q-44 | `th.boxme_internal_max_*` |
