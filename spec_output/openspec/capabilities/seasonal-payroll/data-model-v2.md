# Data Model v0.2 — Multi-Country, Configurable, Grade/Job-Aware

> Supersedes `data-model.md` (v0.1) — adds tables for multi-country, configurable compensation, worker grades, job types, legal limits, and system configs.
>
> **MVP only requires** the tables marked **(P1)**. Rest are seeded with defaults but unused until later phases.

## Entity map (extended)

```
                    ┌──────────────┐    ┌──────────────────┐
                    │  countries   │───▶│  legal_limits    │
                    └──────┬───────┘    └──────────────────┘
                           │
                ┌──────────┼──────────┐
                ▼          ▼          ▼
          ┌──────────┐ ┌─────────┐ ┌──────────┐
          │warehouses│ │holidays │ │system_configs│ (per-country)
          └────┬─────┘ └─────────┘ └──────────┘
               │
               ▼
        ┌──────────────┐    ┌────────────────┐
        │   workers    │◀──▶│worker_grade_   │
        │              │    │ assignments    │
        └──────┬───────┘    └────────┬───────┘
               │                     │
               │              ┌──────▼──────┐
               │              │worker_grades│
               │              └─────────────┘
               │
               │     ┌──────────────────┐
               │     │ compensation_    │
               │  ┌─▶│ components       │
               │  │  └─────────┬────────┘
               │  │            │
               │  │  ┌─────────▼────────┐
               │  └──┤compensation_rules│ (specificity-resolved)
               │     └─────────┬────────┘
               │               │
               ▼               ▼
        ┌──────────────────────────────┐
        │ attendance_records           │ (P1)
        │  + job_type_code             │
        │  + warehouse_id              │
        └──────┬───────────────────────┘
               │
               ▼
        ┌──────────────────────────────┐
        │ payroll_daily (P1)           │ ─── 1:N ──▶ payroll_daily_components
        └──────┬───────────────────────┘                (one row per component)
               │
               ▼
        ┌──────────────────────────────┐
        │ payroll_periods              │ ─── 1:N ──▶ payroll_period_lines
        └──────┬───────────────────────┘
               │
               ▼
        ┌──────────────────────────────┐
        │ bank_exports (P1)            │
        └──────────────────────────────┘
```

---

## New / modified tables

### `countries` (NEW, P1 seeded)
See `multi-country.md` §1. Pre-seeded with TH (active), VN (inactive), PH (inactive).

### `warehouses` (NEW, P1)
See `multi-country.md` §2.

### `holidays` (NEW, P2 used; P1 seeded with empty rows)
See `multi-country.md` §3.

### `legal_limits` (NEW, P1 seeded for TH; P3+ for VN, PH)
See `work-limits.md`.

### `system_configs` (NEW, P1)
See `default-configs.md`. **Critical for MVP** — every non-trivial computation reads a config; the rule engine respects effective_from.

### `worker_grades` (NEW, P3 used; P1 seed `["NEW"]`)
See `compensation.md` §2.3.

### `worker_grade_assignments` (NEW, P3 used; P1 unused)
See `compensation.md` §2.5.

### `job_types` (NEW, P3 used; P1 seed `["GENERAL"]`)
See `compensation.md` §2.4.

### `compensation_components` (NEW, P1 with subset)
See `compensation.md` §2.1. P1 seeds: `base_wage`, `ot_pay`, `late_deduction`, `early_out_deduction`, `damage_deduction`. P2 adds: `meal_allowance`, `transport_allowance`, `night_premium`, `holiday_premium`.

### `compensation_rules` (NEW, P1 with TH base+OT only)
See `compensation.md` §2.2.

### `attendance_records` (MODIFIED for P1)
Adds:
- `country_code` TEXT FK NOT NULL DEFAULT 'TH'
- `warehouse_id` UUID FK NOT NULL
- `job_type_code` TEXT FK NULL DEFAULT 'GENERAL'

### `payroll_daily` (MODIFIED, P1)
Replaces flat `late_deduction_thb`, `ot_pay_thb`, etc. with itemized component rows in `payroll_daily_components`. **Keeps** the denormalized totals for backward compat:
- `country_code`, `currency_code`
- `gross_wage_amount` (renamed from `gross_wage_thb` — currency now polymorphic)
- All other denormalized totals as before for fast period-aggregation.

### `payroll_daily_components` (NEW, P1 minimal use, fully utilized P2+)
See `compensation.md` §7.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `payroll_daily_id` | UUID FK | |
| `component_code` | TEXT FK | |
| `amount` | NUMERIC(12,4) | signed (subtraction = negative) |
| `currency_code` | TEXT | inherited from country |
| `rule_id` | UUID FK | which `compensation_rules` row resolved this |
| `formula_breakdown` | JSONB | input variables for transparency |

### `payroll_periods`, `payroll_period_lines`, `bank_exports`, `audit_log`
Same as v0.1, but every monetary field now has a `currency_code` companion column.

---

## RLS additions for multi-country

Every domain table (workers, attendance_records, payroll_daily, damage_deductions, bank_exports) gets a `country_code` column. RLS policy:

```sql
CREATE POLICY "country_isolation" ON workers
FOR ALL TO authenticated
USING (country_code = ANY(get_user_countries(auth.uid())));
```

Where `get_user_countries` reads from `user_country_access(user_id, country_code)`.

This guarantees a TH HR user can never see VN or PH data, and vice versa.

---

## Migration plan from v0.1 to v0.2

If v0.1 was implemented before this spec lands (it shouldn't have been, but just in case):

```sql
-- 1. Add new tables (no impact)
CREATE TABLE countries (...);
CREATE TABLE warehouses (...);
-- ... etc.

-- 2. Add columns to existing tables with safe defaults
ALTER TABLE workers ADD COLUMN country_code TEXT DEFAULT 'TH' REFERENCES countries(code);
ALTER TABLE workers ADD COLUMN warehouse_id UUID DEFAULT (SELECT id FROM warehouses WHERE code='TH-BKK-1');
ALTER TABLE workers ADD COLUMN grade_code TEXT DEFAULT 'NEW' REFERENCES worker_grades(code);
ALTER TABLE attendance_records ADD COLUMN country_code TEXT DEFAULT 'TH';
ALTER TABLE attendance_records ADD COLUMN warehouse_id UUID DEFAULT (...);
ALTER TABLE attendance_records ADD COLUMN job_type_code TEXT DEFAULT 'GENERAL';

-- 3. Migrate existing rate_configs into compensation_components + compensation_rules
INSERT INTO compensation_components (code, ...) VALUES ('base_wage', ...);
INSERT INTO compensation_rules (component_code, country_code, amount, ...)
  SELECT 'base_wage', 'TH', daily_rate_thb, ... FROM rate_configs;

-- 4. Replace direct rate_configs reads with compensation_rules resolver in payroll service.

-- 5. Drop rate_configs (deprecate, keep for 1 release).
```

For a fresh start (recommended): just create v0.2 schema directly, skip v0.1.

---

## Indexes & partitioning (P1)

- `attendance_records (country_code, work_date)` — hot path for daily payroll compute
- `attendance_records (worker_id, work_date)` — worker history queries
- `attendance_records (status)` — pending review queue
- Partition `attendance_records` by `country_code` (3-way partition: TH/VN/PH) for performance and easier export
- `compensation_rules (component_code, effective_from, effective_to)` — rule resolution
- `system_configs (config_key)` — lookup
- Materialized view `worker_hours_summary` refreshed nightly + on attendance_records write

---

## Storage & retention

- `attendance_records`, `payroll_daily`, `payroll_periods`, `bank_exports` retain for `th.attendance_retention_years` (default 7).
- After retention, archive to cold storage (S3 Glacier) and purge from hot DB.
- `audit_log` retains forever (or per `audit_log_retention_years`).
- PII fields encrypted at rest using Supabase Vault.
