# Legal Work-Time Limits / Giới hạn pháp lý về thời gian làm việc

> **Goal**: Each country has its own legal cap on hours worked per day/week/month/year. The system must (a) **store** these as configurable rows, (b) **warn** during data entry when limits are approached, and (c) **block period close** when hard limits are violated.
>
> **Note**: Seasonal hiring is on-demand — workers come in only when needed — so monthly/yearly caps are typically not hit, but per-day and per-week limits are meaningful.

## 1. Schema

```sql
legal_limits
├─ id                  UUID PK
├─ country_code        TEXT FK
├─ scope               TEXT CHECK ∈ ('worker', 'department', 'global')
├─ rule_type           TEXT CHECK ∈ (
│                          'max_hours_per_day',
│                          'max_hours_per_week',
│                          'max_hours_per_month',
│                          'max_hours_per_year',
│                          'max_ot_hours_per_day',
│                          'max_ot_hours_per_week',
│                          'max_ot_hours_per_month',
│                          'max_ot_hours_per_year',
│                          'min_rest_hours_between_shifts',
│                          'min_age',
│                          'max_consecutive_days_without_rest'
│                       )
├─ value_numeric       NUMERIC(10,2)
├─ enforcement         TEXT CHECK ∈ ('warn', 'block')
├─ notes_local         TEXT
├─ effective_from      DATE
├─ effective_to        DATE NULL
├─ active              BOOLEAN
```

## 2. Pre-seeded values (best-effort summary; team to verify)

### 2.1 Thailand (TH)

| rule_type | value | enforcement | source |
|---|---|---|---|
| max_hours_per_day | 8 | warn | Labor Protection Act |
| max_ot_hours_per_week | 36 | warn | LPA §24 |
| max_consecutive_days_without_rest | 6 | warn | (1 day off / week required) |
| min_rest_hours_between_shifts | 10 | warn | for hazardous work; 8 standard |
| min_age | 15 | block | (children under 15 cannot work) |
| max_hours_per_day_under_18 | 8 | block | strict for minors |

### 2.2 Vietnam (VN) — Phase 3

| rule_type | value | enforcement | source |
|---|---|---|---|
| max_hours_per_day | 8 (10 with OT) | warn | Labor Code 2019 §107 |
| max_ot_hours_per_day | 4 | warn | §107 |
| max_ot_hours_per_month | 40 | warn | §107 |
| max_ot_hours_per_year | 200 (300 special industries) | warn | §107 |
| max_hours_per_week | 48 | warn | §105 |
| min_age | 15 | block | §3 |

### 2.3 Philippines (PH) — Phase 4

| rule_type | value | enforcement | source |
|---|---|---|---|
| max_hours_per_day | 8 | warn | Labor Code §83 |
| max_hours_per_week | 48 | warn | (6-day work week) |
| min_rest_hours_between_shifts | 8 | warn | |
| min_age | 15 | block | |

> **Action**: Boxme legal team must validate all entries above before MVP go-live for TH, and before each country expansion. Different industries and special permits may extend these.

## 3. Enforcement points

| Trigger | Check | Behavior |
|---|---|---|
| Save attendance_record | `(checkout - checkin) > max_hours_per_day` | warn |
| Save attendance_record | `worker_grade == minor` and value > `max_hours_per_day_under_18` | block |
| Save OT entry | OT hours per day > `max_ot_hours_per_day` | warn |
| Save attendance_record | week-to-date OT > `max_ot_hours_per_week` | warn |
| Save attendance_record | month-to-date OT > `max_ot_hours_per_month` | warn |
| Save attendance_record | year-to-date OT > `max_ot_hours_per_year` | warn (block at 110%) |
| Period close | any worker exceeded any `block`-level limit | block until reconciled |
| Worker enrollment | `birthdate` makes age < min_age | block |

## 4. Aggregations (pre-computed views)

To make limit checks fast, the system maintains:

```sql
worker_hours_summary (materialized view, refreshed nightly + on-demand)
├─ worker_id
├─ country_code
├─ period             TEXT     -- e.g. '2026-W17', '2026-04', '2026'
├─ regular_hours      NUMERIC
├─ ot_hours           NUMERIC
├─ days_worked        INT
├─ last_checkout_at   TIMESTAMPTZ
```

Period-close UI shows red badges next to any worker exceeding warn thresholds.

## 5. Reporting

A "Compliance" dashboard tab surfaces:
- Workers nearing yearly OT cap (e.g., > 80% of 200 hrs).
- Workers without a rest day in N consecutive days.
- Workers under 18 (special handling).

## 6. Open questions

- **Q-42**: For TH, are seasonal workers covered by full Labor Protection Act, or by a different category? (E.g., daily wage workers may have different limits.)
- **Q-43**: Are there industry-specific exemptions for warehouse work in TH/VN/PH?
- **Q-44**: Does Boxme want to enforce internal limits stricter than legal (e.g., max 10 hrs/day)?
