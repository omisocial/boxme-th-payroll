# Edge Cases Catalogue

Each entry comes from real data in `Thailand_Sessonal_Payment.xlsx`. The system must handle each one explicitly.

## Time / Attendance

### EC-1 Manual checkin when phone app fails
**Pattern**: Note column K = `โทรศัพท์เข้าแอปไม่ได้เช็คอินสาย`. Checkin time often suspiciously rounded (e.g. exactly `08:30:00`).
**System handling**:
- Mandatory `checkin_source = manual_supervisor` flag.
- Log who entered (`checkin_entered_by`).
- Display warning icon in UI when source = manual.
- Q-22.

### EC-2 Missing checkout (worker forgot to clock out)
**Pattern**: row has checkin but no checkout.
**System handling**:
- Mark `payroll_daily.gross_wage_thb = 0` and status = `incomplete`.
- Block period close until reconciled (supervisor sets manual checkout, or marks day as absent).
- Q-23.

### EC-3 Night shift crossing midnight (`17:00 - 02:00`)
**Pattern**: shift end < shift start.
**System handling**:
- `shifts.crosses_midnight = TRUE`.
- Hours bucket: `(24 - hours(S)) + hours(T)`.
- Late detection: if checkin_time_of_day < shift_end (i.e., past midnight), special-case.
- Q-24.

### EC-4 Late minutes with sub-second precision
**Pattern**: `Q = 0.65` (~39 sec late).
**System handling**:
- Apply `late_buffer_minutes` (Q-5).
- Apply `late_rounding_unit` (Q-6).
- Default until team confirms: 0 buffer, no rounding (matches Excel).

### EC-5 Same worker, multiple shifts in one day
**Pattern**: Some workers do morning + night (separate sheet entries).
**System handling**:
- Two `attendance_records` rows with different `shift_code`.
- Each computes its own `payroll_daily`; period aggregation sums both.

## Workers / Identity

### EC-6 Nickname collision (93 nicknames have ≥2 workers; one has 7)
**System handling**:
- Never use nickname as join key.
- Lookup by `worker_code` always; UI shows `nickname (worker_code)` for disambiguation.
- Q-25.

### EC-7 Full-name typo on import
**Pattern**: same Thai full name typed with vs. without a space between first name and surname (real example seen — anonymized here).
**System handling**:
- Fuzzy match (Levenshtein on Thai name, normalized whitespace).
- Show top-5 candidates with confidence scores.
- HR confirms; system stores exact-match alias for future imports.

### EC-8 New walk-in worker not in roster
**System handling**:
- Import flags as error: "Worker not found".
- HR uses UC-3 to enroll.
- After enrollment, re-run import row.

### EC-9 Department typo (`Bm1`, `Dw3`, `แมบ้าน`)
**System handling**:
- Normalize case: `^(BM|DW)\d+$` regex (case-insensitive).
- Distance-1 typo dictionary for Thai dept names: `แมบ้าน → แม่บ้าน`, `นศ.ฝึกงาน → นักศึกษาฝึกงาน`.
- Surface as warning before saving.

### EC-10 Department code variants (`แม่บ้าน`, `แม่บ้านสา`, `แม่บ้านชม้อย`)
**Open question**: Are these distinct sub-categories or just embellished names of the same `แม่บ้าน` category?
**Default**: Treat as one canonical `แม่บ้าน` category; preserve subname as worker tag for HR's reference.

## Wage / Calculation

### EC-11 Daily rate temporarily zero
**Pattern**: `rate_configs` not configured for a period.
**System handling**:
- Block compute with error.
- Surface in admin dashboard ("missing rate config for dept BM3 on 2026-04-30").

### EC-12 Damage > daily wage (gross becomes negative)
**Pattern**: damage 600 THB on a 500 THB day.
**System handling** (proposed; pending Q-19):
- Floor `gross_wage_thb` at 0.
- Carry surplus 100 THB to next scheduled deduction date.
- If worker resigns before carryover applied → write-off.

### EC-13 OT but full-shift late
**Pattern**: TC06 — 89 min late + 2h OT.
**System handling**:
- Compute as-is per formula. Surface as warning ("OT requested by late-arriving worker") for manager review.

### EC-14 Sick leave with checkout-out
**Pattern**: TC07 — `ลาป่วยกลับบ้าน 10:42`. Worker leaves at 10:42, gross drops to 72 THB.
**System handling**: pending Q-12.
- Default v1 (matches Excel): full early-out deduction.
- Proposed v1.1 (after Q-12 answered): if `note_classified = sick`, treat as paid sick leave with policy cap.

## Damage log

### EC-15 Multi-day split deduction
**Pattern**: 913.82 THB → 3 days, partial residual.
**System handling**:
- `damage_deductions` row 1 with total 913.82.
- `damage_deduction_schedule` rows N: each (date, amount).
- On each scheduled date, payroll compute looks up scheduled amount and applies.

### EC-16 Outstanding damage on resigned worker
**Pattern**: `ลาออกไปแล้ว` in damage_log notes column.
**System handling**: pending Q-19.
- Modal at resignation: write-off vs. send to collections vs. apply to final pay.

### EC-17 Damage cause is incident description, not category
**Pattern**: `แพ็คผิดวันที่ 13/11`, `ทำของเสียหาย` mixed with `แพ็คผิด 14/12/68`.
**System handling**:
- Free-text `cause` field on `damage_deductions`.
- Optional `cause_category` enum (mis-pack, dropped, mis-pick, other) for reporting.

### EC-18 Date in damage log is mixed Buddhist + Gregorian
**Pattern**: `25/02/69` (Buddhist year), `28/02/69`, `2025-03-11`, `7 มีนาคม`.
**System handling**:
- Internal storage: ISO Gregorian.
- Import parser handles `dd/mm/yy` where `yy ≥ 50` → Buddhist (subtract 543); else Gregorian.
- Manual date entry UI allows toggling display between พ.ศ. and ค.ศ.

## Master data

### EC-19 Phone format inconsistency
**Pattern**: leading apostrophe (`'XXXXXXXXXX`), bare digits (`XXXXXXXXXX`), leading-space-plus-apostrophe (`' XXXXXXXXXX`), and `-` placeholder all observed.
**System handling**:
- On import: strip leading apostrophe (`'`), trim whitespace, keep digit-only string.
- Empty / `-` → NULL.
- Validate with Thai mobile pattern `^0[6-9]\d{8}$`.

### EC-20 Bank account empty
**System handling**:
- Worker is excluded from bank export; appears in "Cash payouts" report instead.
- HR can add bank info later; subsequent exports include them.

### EC-21 Start date typo (`28/1/6026`)
**Pattern**: data entry slip.
**System handling**:
- Validation: year must be in `[2010, current_year+1]`.
- On import: flag as error; HR fixes manually.

### EC-22 Start date is non-date text (`แม่บ้านพี่เก`)
**System handling**:
- Same validation. NULL the field; flag for HR review.

## Sheet integrity

### EC-23 Result sheet broken (col index 27/28 vs 32/33)
**Note**: Existing Excel cannot be trusted as a reconciliation source. Replace with system-generated reports.

### EC-24 Missing day sheets (6, 13, 14, 15, 31)
**Pattern**: Result formula returns 0 silently.
**System handling**:
- Period reports show "no data" for missing days.
- Q-29 confirms whether they were non-working days.

### EC-25 Excel file with no calculated values
**Pattern**: file saved without resolving formulas.
**System handling**:
- During import, ignore cached formula values; always compute from inputs.
- Don't rely on AH (gross) from Excel.
