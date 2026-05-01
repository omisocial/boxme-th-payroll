# Configurable Compensation System / Hệ thống lương phụ cấp linh hoạt

> **Goal**: Decompose pay into independent components (base wage, OT, allowances, bonuses) each resolved by a rule that scopes context (country × warehouse × department × shift × grade × job_type × date). Designed so HR can add a new "transport allowance" or "night-shift premium" entirely from the admin UI, no code change.
>
> **MVP scope**: TH only, using only **base wage + OT**. Allowance components ship in Phase 2.

## 1. Concept

A worker's daily pay is computed as a **sum of components**, each resolved independently:

```
gross_pay = Σ component_pay[i]  for each enabled component

where component_pay[i] = formula(component_type, context)
```

**Component types** (extensible, MVP ships with 4):

| Type | Unit | Formula | MVP? |
|---|---|---|---|
| `base_wage` | per shift | `daily_rate` × `attendance_factor` | ✅ Phase 1 |
| `ot_pay` | per hour | `(daily_rate / U) × multiplier × hours` | ✅ Phase 1 |
| `late_deduction` | per minute | `(daily_rate / U / 60) × minutes` | ✅ Phase 1 |
| `early_out_deduction` | per minute | same as late | ✅ Phase 1 |
| `damage_deduction` | per incident | from damage_deductions log | ✅ Phase 1 |
| `meal_allowance` | per shift | flat amount | Phase 2 |
| `transport_allowance` | per shift | flat amount | Phase 2 |
| `night_shift_premium` | per shift | `daily_rate × multiplier` | Phase 2 |
| `attendance_bonus` | per period | conditional flat or % | Phase 2 |
| `referral_bonus` | per event | flat amount | Phase 3 |
| `holiday_premium` | per shift | `daily_rate × multiplier` | Phase 2 |

## 2. Schema

### 2.1 `compensation_components`

```sql
compensation_components
├─ code                TEXT PK    -- 'base_wage', 'ot_pay', 'meal_allowance', 'night_premium' …
├─ category            TEXT       -- 'wage', 'overtime', 'allowance', 'deduction', 'bonus'
├─ unit                TEXT       -- 'per_shift', 'per_hour', 'per_minute', 'per_period', 'per_incident'
├─ kind                TEXT       -- 'addition' or 'subtraction'
├─ formula_template    TEXT       -- e.g. 'AMOUNT', 'AMOUNT × HOURS', 'AMOUNT × MULTIPLIER × HOURS', 'CUSTOM_SQL'
├─ taxable             BOOLEAN    -- relevant for Phase 4
├─ included_in_ot_base BOOLEAN    -- whether this component contributes to OT base rate
├─ display_order       INT
├─ active              BOOLEAN
```

Example seed rows:

| code | category | unit | kind | formula_template | included_in_ot_base |
|---|---|---|---|---|---|
| base_wage | wage | per_shift | addition | AMOUNT | yes |
| ot_pay | overtime | per_hour | addition | AMOUNT × MULTIPLIER × HOURS | no |
| meal_allowance | allowance | per_shift | addition | AMOUNT | no |
| transport_allowance | allowance | per_shift | addition | AMOUNT | no |
| night_premium | allowance | per_shift | addition | AMOUNT × MULTIPLIER | yes |
| late_deduction | deduction | per_minute | subtraction | AMOUNT × MINUTES | n/a |
| damage_deduction | deduction | per_incident | subtraction | AMOUNT | n/a |

### 2.2 `compensation_rules`

A rule expresses **which amount/multiplier applies** when a context matches. Multiple rules can match — the **most specific** one wins (specificity scored by # of non-NULL filter columns).

```sql
compensation_rules
├─ id                  UUID PK
├─ component_code      TEXT FK → compensation_components

-- Context filters (NULL = any). All non-NULL must match.
├─ country_code        TEXT NULL
├─ warehouse_id        UUID NULL
├─ department_code     TEXT NULL
├─ shift_code          TEXT NULL
├─ worker_grade_code   TEXT NULL
├─ job_type_code       TEXT NULL
├─ day_of_week         INT  NULL   -- 1..7, NULL=any
├─ is_holiday          BOOL NULL   -- NULL=any, TRUE=only holiday, FALSE=only non-holiday

-- Effective dates
├─ effective_from      DATE NOT NULL
├─ effective_to        DATE NULL

-- Amounts
├─ amount              NUMERIC(12,4) NULL  -- e.g. 500.00 base wage, 50.00 meal allowance
├─ multiplier          NUMERIC(6,4) NULL   -- e.g. 1.5 OT mult, 2.0 holiday premium
├─ currency_code       TEXT NOT NULL

-- Optional condition expression for advanced cases (Phase 3+)
├─ condition_dsl       TEXT NULL  -- e.g. 'shift_starts_at >= 22:00'

├─ priority            INT DEFAULT 0  -- tiebreaker if specificity ties
├─ created_at, created_by
```

**Rule resolution algorithm** (per (worker, work_date, shift, component)):
1. Filter rules where component_code matches AND effective dates cover work_date.
2. Filter rules where every non-NULL context column matches the worker/shift context (or column is NULL).
3. Score each: specificity = count of non-NULL context columns.
4. Pick highest specificity; tiebreak by `priority` DESC, then `created_at` DESC.

If no rule matches → component contributes 0 (no error).

### 2.3 `worker_grades`

```sql
worker_grades
├─ code               TEXT PK    -- 'NEW', 'SENIOR', 'LEAD', 'MASTER'
├─ name_local         TEXT       -- 'มือใหม่', 'พนักงานอาวุโส'
├─ name_en            TEXT
├─ description        TEXT
├─ display_order      INT
```

Workers gain grades over time (HR-managed). Used as a `compensation_rules` filter.

### 2.4 `job_types`

```sql
job_types
├─ code               TEXT PK    -- 'PICKING', 'PACKING', 'LOADING', 'INVENTORY'
├─ name_local         TEXT       -- 'หยิบสินค้า', 'แพ็คสินค้า'
├─ name_en            TEXT
├─ description        TEXT
```

A worker's job for a given shift is set in `attendance_records.job_type_code`. Allows different rates for hard physical work (loading) vs lighter (picking).

### 2.5 `worker_grade_assignments` (versioned)

```sql
worker_grade_assignments
├─ id                 UUID PK
├─ worker_id          UUID FK
├─ grade_code         TEXT FK
├─ effective_from     DATE
├─ effective_to       DATE NULL
├─ assigned_by        UUID FK auth.users
├─ note               TEXT
```

Resolves a worker's grade as-of any date.

## 3. Worked example — TH MVP (Phase 1)

Rules pre-seeded for MVP (TH only, Apr 2026):

| component_code | country | warehouse | dept | shift | grade | job | from | amount | multiplier |
|---|---|---|---|---|---|---|---|---|---|
| base_wage | TH | NULL | NULL | NULL | NULL | NULL | 2026-04-01 | 500.00 | — |
| ot_pay | TH | NULL | NULL | NULL | NULL | NULL | 2026-04-01 | — | 1.5 |
| late_deduction | TH | NULL | BM* | NULL | NULL | NULL | 2026-04-01 | — | — |
| late_deduction | TH | NULL | DW* | NULL | NULL | NULL | 2026-04-01 | — | — |
| (no late_deduction rule for แม่บ้าน / นักศึกษา → 0) | | | | | | | | | |
| early_out_deduction | TH | NULL | NULL | NULL | NULL | NULL | 2026-04-01 | — | — |
| damage_deduction | TH | NULL | NULL | NULL | NULL | NULL | 2026-04-01 | — | — |

**Note**: For `late_deduction` we use department wildcards. The "BM*" / "DW*" semantics come via a department's `late_penalty_applies` flag (data-model.md), so the rule itself can stay simple — just check the flag at compute time. Alternatively the rule can omit the dept filter and the system reads `departments.late_penalty_applies` directly.

## 4. Worked example — TH Phase 2 (with allowances)

Suppose Boxme TH starts offering meal + transport + night premium to attract workers:

| component_code | country | shift | grade | from | amount | multiplier |
|---|---|---|---|---|---|---|
| base_wage | TH | NULL | NULL | 2026-04-01 | 500.00 | — |
| meal_allowance | TH | NULL | NULL | 2026-06-01 | 50.00 | — |
| transport_allowance | TH | NULL | NULL | 2026-06-01 | 30.00 | — |
| night_premium | TH | N1700 (17:00-02:00) | NULL | 2026-06-01 | 100.00 | — |
| ot_pay | TH | N1700 | NULL | 2026-06-01 | — | 2.0 (night OT premium) |
| ot_pay | TH | NULL | NULL | 2026-06-01 | — | 1.5 (default) |

A worker on a night shift with 1 hour OT → resolves:
- base_wage: 500
- meal_allowance: 50
- transport_allowance: 30
- night_premium: 100
- ot_pay: (500/8) × **2.0** × 1 = 125 (the night-specific rule wins over the default by specificity)

→ gross = 805 THB

## 5. Worked example — VN expansion (Phase 3)

When VN onboards:

| component_code | country | from | amount THB | currency |
|---|---|---|---|---|
| base_wage | VN | 2026-09-01 | 250000 | VND |
| ot_pay | VN | 2026-09-01 | — / 1.5 | VND |
| meal_allowance | VN | 2026-09-01 | 30000 | VND |

No code change. Just rows.

## 6. Why not simply add columns to `rate_configs`?

Adding columns each time HR wants a new allowance type doesn't scale and breaks reporting. The **component + rule** pattern lets HR:
- Add a new "weekend bonus" by inserting one row.
- Phase out an allowance by setting `effective_to`.
- Run a "what-if" simulation (Phase 3 feature).
- Itemize each component on the worker's payslip (regulatory requirement in some countries).

## 7. Reporting

`payroll_daily` will store **one row per (attendance, component)** so each component is itemized. Existing aggregate fields (`gross_wage_thb`, `late_deduction_thb`, etc.) can be derived or stored as a denormalized summary.

```sql
payroll_daily_components
├─ id                UUID PK
├─ payroll_daily_id  UUID FK
├─ component_code    TEXT FK
├─ amount            NUMERIC(12,4)
├─ currency_code     TEXT
├─ rule_id           UUID FK   -- which rule resolved this
├─ formula_breakdown JSONB     -- e.g., {"daily_rate":500,"hours":8,"multiplier":1.5,"hours_worked":1.5}
```

This enables a payslip view: "Base wage 500.00 + OT 187.50 + Meal 50.00 − Late 80.80 = 656.70 THB".

## 8. Open questions for Thailand team (extends checklist)

- **Q-39**: For Phase 2, what allowances do you want to add (meal, transport, night, attendance bonus)? Default amounts?
- **Q-40**: Should allowance be paid even on partial-day attendance (e.g., sick worker arriving 9 AM)?
- **Q-41**: Are there any **performance/output-based** components (e.g., piece-rate per package picked)?
