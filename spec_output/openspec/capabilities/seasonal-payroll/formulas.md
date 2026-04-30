# Payroll Formulas — Canonical Pseudocode

> Pseudocode below mirrors the formulas extracted from `Thailand_Sessonal_Payment.xlsx` daily sheets, normalized for clarity. Every numeric default annotated `⚠️ Q-NN` is an open question in the audit checklist; do not treat as final.

## Inputs (per attendance_record)

```
worker_id           uuid
work_date           date
shift_code          text          → resolves to start_time S, end_time T, crosses_midnight, standard_minutes
checkin_at          timestamptz | null
checkout_at         timestamptz | null
note_classified     enum
ot_before_hours     decimal       (manual entry; default 0)
ot_after_hours      decimal       (manual entry; default 0)
damage_amount_thb   decimal       (rolled up from schedule; default 0)
other_deduction_thb decimal       (default 0; ⚠️ Q-15 — purpose unclear)
```

## Rate resolution

```
rate := SELECT * FROM rate_configs
        WHERE department_code = worker.department_code
          AND effective_from <= work_date
          AND (effective_to IS NULL OR effective_to >= work_date)
        ORDER BY effective_from DESC LIMIT 1

IF rate IS NULL:
    rate := SELECT * FROM rate_configs
            WHERE department_code IS NULL  -- default
            AND  ... same date filter ... LIMIT 1

assert rate IS NOT NULL  -- otherwise misconfigured period
```

Rate fields used: `daily_rate_thb`, `ot_multiplier`, `ot_multiplier_holiday`, `ot_min_unit_minutes`, `late_buffer_minutes`, `late_rounding_unit`.

## Step 1 — Hours bucket `U`

> Mirrors Excel: `=IF(IF(T<S,(T+1-S)*24,(T-S)*24)<=6,5,8)`. Q-9.

```
shift_duration_hours :=
  IF crosses_midnight: ((24 - hours(S)) + hours(T))
  ELSE:                (hours(T) - hours(S))

U := 5 IF shift_duration_hours <= 6 ELSE 8
```

## Step 2 — Wage per minute

```
wage_per_minute := daily_rate_thb / (U * 60)
```

## Step 3 — Late deduction

> Mirrors Excel `Q = (O−S)*1440` then `V = Q if dept ∈ BM/DW else 0`. Q-5, Q-6, Q-7.

```
late_minutes_raw :=
  IF checkin_at IS NULL: 0   -- no checkin treated as 0 late + flagged as "absent" downstream
  ELSE:
    checkin_time_of_day := hours/minutes/seconds part of checkin_at
    IF crosses_midnight AND checkin_time_of_day < shift_end_time:
        -- e.g., night shift checkin past midnight
        diff_minutes := 0  -- ⚠️ Q-24: confirm policy
    ELSE:
        diff_minutes := MAX(0, (checkin_time_of_day - S) in minutes)

# Buffer (Q-5)
late_minutes_after_buffer := MAX(0, late_minutes_raw - rate.late_buffer_minutes)

# Rounding (Q-6) — currently NO rounding, decimal precision
late_minutes_rounded :=
  IF rate.late_rounding_unit > 1:
      CEIL(late_minutes_after_buffer / rate.late_rounding_unit) * rate.late_rounding_unit
  ELSE:
      late_minutes_after_buffer

# Department exemption (Q-7)
late_minutes_deducted :=
  IF department.late_penalty_applies:
      late_minutes_rounded
  ELSE:
      0

late_deduction_thb := wage_per_minute * late_minutes_deducted
```

## Step 4 — Early-out deduction

```
early_out_minutes :=
  IF checkout_at IS NULL: 0   -- ⚠️ Q-23: alternative is "absent for the rest of shift"
  ELSE:
    checkout_time_of_day := hours/minutes part of checkout_at
    IF crosses_midnight AND checkout_time_of_day > shift_start_time:
        # e.g., night shift normal checkout time was already past midnight
        diff_minutes := MAX(0, (T+24h - checkout) in minutes)
    ELSE:
        diff_minutes := MAX(0, (T - checkout_time_of_day) in minutes)

# Note: same buffer/rounding/exemption rules as late could apply (Q-5/Q-6/Q-7) — currently NONE applied to early-out in Excel
early_out_deduction_thb := wage_per_minute * early_out_minutes
```

> **Open question**: should sick/medical/personal leave classifications (`note_classified ∈ {sick, medical, personal_leave}`) bypass this deduction? See Q-12, Q-13, Q-14.

## Step 5 — OT pay

> Mirrors Excel `AG = (AA/U) * 1.5 * (AC + AE)`. Q-16, Q-17, Q-18.

```
ot_total_hours_raw := ot_before_hours + ot_after_hours

# Minimum unit (Q-18)
ot_total_hours :=
  IF rate.ot_min_unit_minutes > 0:
      CEIL(ot_total_hours_raw * 60 / rate.ot_min_unit_minutes) * rate.ot_min_unit_minutes / 60
  ELSE:
      ot_total_hours_raw

# Multiplier — holiday rate if applicable (Q-16)
ot_multiplier :=
  IF work_date IS in holidays AND rate.ot_multiplier_holiday IS NOT NULL:
      rate.ot_multiplier_holiday
  ELSE:
      rate.ot_multiplier

ot_pay_thb := (daily_rate_thb / U) * ot_multiplier * ot_total_hours
```

## Step 6 — Sick / leave handling (NEW — pending Q-12/13/14)

```
# Default: leave_classifications follow Excel behavior (penalty applies as if voluntary early-out)
# Proposed (subject to team confirmation): paid_leave_classifications cancel the early_out deduction

paid_leave_classes := {} or {sick, medical}  -- ⚠️ Q-12

IF note_classified IN paid_leave_classes:
    early_out_deduction_thb := 0    # treat as paid sick day

# Half-day classifications (Q-13)
IF note_classified == 'half_day_morning' OR 'half_day_afternoon':
    daily_wage_for_calc := daily_rate_thb * 0.5
    # then re-derive deductions/OT against the half-day wage
```

## Step 7 — Gross & Net

> Mirrors Excel `AH = (AA - W - Z - AI - AJ) + AG`. Q-15, Q-19.

```
gross_wage_thb_raw :=
  daily_rate_thb
  - late_deduction_thb
  - early_out_deduction_thb
  - damage_deduction_thb
  - other_deduction_thb
  + ot_pay_thb

# Floor at 0 (Q-19) — never pay negative
gross_wage_thb := MAX(0, gross_wage_thb_raw)

# Carry-over surplus damage (Q-19) — proposed
IF gross_wage_thb_raw < 0:
    surplus := ABS(gross_wage_thb_raw)
    INSERT INTO damage_deduction_schedule
      (damage_id = current_damage, scheduled_date = next_work_date, amount = surplus, applied = false)
```

## Step 8 — Period aggregation

```
period_line.total_gross_thb           := SUM(payroll_daily.gross_wage_thb WHERE worker_id=W AND work_date IN period)
period_line.total_ot_thb              := SUM(payroll_daily.ot_pay_thb)
period_line.total_late_deduction_thb  := SUM(payroll_daily.late_deduction_thb)
period_line.total_early_out_thb       := SUM(payroll_daily.early_out_deduction_thb)
period_line.total_damage_thb          := SUM(payroll_daily.damage_deduction_thb)

period.total_workers     := COUNT(DISTINCT worker_id)
period.total_gross_thb   := SUM(period_line.total_gross_thb)
```

## Step 9 — Validation rules (computed alongside)

| Rule | Severity | Action |
|---|---|---|
| `checkin_at IS NULL AND checkout_at IS NULL` | warn | flag as `absent`, set gross=0 |
| `checkin_at IS NOT NULL AND checkout_at IS NULL` | warn | flag as `incomplete`, set gross=0 OR auto-fill T (Q-23) |
| `gross_wage_thb_raw < 0` | warn | floor at 0; carry surplus to next day |
| `late_minutes > U*60` (full shift) | error | likely data entry error — block approval |
| `ot_total_hours > 8` | warn | unusual — require manager note |
| `damage_amount_thb > daily_rate_thb` | warn | full wage offset; check schedule split |
| `worker.status = 'resigned' AND work_date > worker.end_date` | error | should not have shift |

---

## Reference: original Excel formulas (verbatim)

```excel
# in row N of วันที่ X sheet
U_N  = IF(IF(T_N<S_N, (T_N+1-S_N)*24, (T_N-S_N)*24) <= 6, 5, 8)
Q_N  = IF(S_N <= O_N, (O_N - S_N) * 1440, 0)
V_N  = IF(OR(LEFT(E_N,2)="BM", LEFT(E_N,2)="DW"), Q_N, 0)
W_N  = (AA_N / U_N) / 60 * V_N
X_N  = IF(D_N < T_N, (T_N - D_N) * 24 * 60, 0)
Y_N  = (AA_N / U_N) / 60
Z_N  = X_N * Y_N
AA_N = IF(AND(T_N>=S_N, S_N>=TIME(9,0,0), T_N<=TIME(15,0,0)), IF(LEFT(TRIM(E_N),2)="DW", 500, 500), 500)
AF_N = AC_N + AE_N
AG_N = (AA_N / U_N) * 1.5 * AF_N
AH_N = (AA_N - W_N - Z_N - AI_N - AJ_N) + AG_N
```
