# Test Cases — Validation Set
## ชุดทดสอบเพื่อตรวจสอบสูตร

**Purpose**: 12 representative scenarios spanning the observed payroll patterns. Each row supplies all inputs and the BA's computed output (using the derived formula at flat THB 500/day, OT × 1.5). Thailand team must reconcile against the actual amount paid (or against fresh Excel re-calculation).

**ใช้ทำอะไร**: 12 กรณีทดสอบ ครอบคลุมทุกแบบของ timesheet. ทีมไทยต้องตอบ "จำนวนเงินที่จ่ายจริง" เพื่อยืนยันสูตร.

**Data privacy**: Workers are referenced by `worker_id` (8-char salted hash). Real names are stored in `private/worker_id_map.csv` (kept locally; not delivered).

**Caveat**: The Excel workbook contains **no cached computed values** for the gross-wage column AH. So `cached_gross_AH` is `None` for every test row and we cannot do auto-validation. Reconciliation requires either (a) opening the file in Excel and saving with formulas calculated, or (b) team supplying actual paid amounts from bank export.

---

## TC01 — Standard 08:30 shift, BM1, marginally late
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 1` r11 |
| Worker | `2248cbf1` |
| Department | BM1 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-01 08:30:39 |
| Checkout | 17:30:00 |
| Note | (none) |
| OT before | 0 | OT after | 0 | Damage | 0 |

**Computed**: late_min=0.65 → late_ded=0.68; early_min=0; OT=0; **GROSS = 499.32 THB**

**Question for team**: Do you actually deduct 0.68 THB for being 39 seconds late? Or is there a buffer (e.g., ≤5 min ignored)?

---

## TC02 — Late ~77 min, BM1
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 1` r9 |
| Worker | `21a1ddde` |
| Department | BM1 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-01 09:47:34 |
| Checkout | 17:30:00 |
| Note | (none) |

**Computed**: late_min=77.57 → late_ded=80.80 THB; **GROSS = 419.20 THB**

---

## TC03 — Early-out (checkout 13:00)
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 9` r40 |
| Worker | `8bb009f9` |
| Department | BM1 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-09 08:16:06 |
| Checkout | 13:00:00 |
| Note | `ลางานช่วงบ่าย` (afternoon leave) |

**Computed**: early_min=270 → early_ded=281.25; **GROSS = 218.75 THB**

**Question for team (Q-13)**: Is `ลางานช่วงบ่าย` treated as half-day off (50% pay) or as voluntary early-out (deduct minutes)?

---

## TC04 — Night shift 17:00-02:00
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 3 กะดึก` r9 |
| Worker | `afa3cdcb` |
| Department | BM1 |
| Shift | 17:00 - 02:00 (crosses midnight, U=8) |
| Checkin | 2026-04-03 17:01:36 |
| Checkout | 02:00:00 |
| Note | (none) |

**Computed**: late_min=1.6 → late_ded=1.67; **GROSS = 498.33 THB**

**Question for team (Q-24)**: For night shift, did the Excel `Q = (O−S)*1440` formula produce the correct late detection in your real records? Provide actual paid amount for spot-check.

---

## TC05 — OT-before 1.5h, BM1
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 7` r38 |
| Worker | `87b45132` |
| Department | BM1 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-07 06:56:24 (early — for OT) |
| Checkout | 17:30:00 |
| Note | `OT 1.5` |
| OT before | 1.5 hr | OT after | 0 |

**Computed**: ot_pay = (500/8) × 1.5 × 1.5 = 140.625; **GROSS = 640.62 THB**

---

## TC06 — OT-after 2h, BM1, late
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 16` r9 |
| Worker | `2248cbf1` |
| Department | BM1 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-16 09:59:00 |
| Checkout | 20:00:00 |
| Note | `OT 2` |
| OT before | 0 | OT after | 2 hr |

**Computed**: late_min=89 → late_ded=92.71; ot_pay = (500/8) × 1.5 × 2 = 187.5; **GROSS = 594.79 THB**

**Question**: Is it valid to be 89 min late AND get 2h OT in the same day? Should late-deduction be waived if OT is significant?

---

## TC07 — Sick leave (left at 10:42)
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 7` r45 |
| Worker | `e2c3b84e` |
| Department | BM3 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-07 08:32:28 |
| Checkout | 10:42:00 |
| Note | `ลาป่วยกลับบ้าน 10:42` |

**Computed**: late_min=2.47 → late_ded=2.57; early_min=408 → early_ded=425.00; **GROSS = 72.43 THB**

**Question (Q-12)**: Sick worker effectively earns ~14% of daily wage. Does the team apply paid sick leave instead?

---

## TC08 — Half-day afternoon leave (same as TC03)
*Identical inputs to TC03 — included separately to highlight that `ลางานช่วงบ่าย` is one of several phrasings.*

---

## TC09 — Damage deduction 500 THB (offsets full wage)
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 1` r74 |
| Worker | `e2e5b9c3` |
| Department | BM3 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-01 08:13:38 |
| Checkout | 17:30:00 |
| Damage AI | 500 |

**Computed**: **GROSS = 0 THB** (daily wage entirely offset by damage)

**Question (Q-19)**: If damage > daily wage (e.g., 600 THB on a 500-day), do you (a) carry over to next day, (b) cap at 0, (c) record negative wage?

---

## TC10 — Intern (นักศึกษา) — late penalty exempt
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 28` r90 |
| Worker | `UNK` (not in Members) |
| Department | นักศึกษา |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-28 08:30:53 |
| Checkout | 17:30:00 |

**Computed**: late_min=0.88 (raw) but **V=0** (intern), so late_ded=0.0; **GROSS = 500.00 THB**

**Question (Q-8)**: Confirm interns earn 500 THB/day, same as BM workers? Or different rate?

---

## TC11 — Housekeeper (แม่บ้าน) — late penalty exempt
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 28` r88 |
| Worker | `UNK` |
| Department | แม่บ้าน |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | 2026-04-28 08:14:41 |
| Checkout | 17:30:00 |

**Computed**: V=0 (housekeeper), **GROSS = 500.00 THB**

---

## TC12 — App checkin failed, manual entry
| Field | Value |
|---|---|
| Sheet / row | `วันที่ 2` r35 |
| Worker | `8692390d` |
| Department | BM3 |
| Shift | 08:30 - 17:30 (U=8) |
| Checkin | **08:30:00** (suspicious round number — manually typed, not from app) |
| Checkout | 17:30:00 |
| Note | `โทรศัพท์เข้าแอปไม่ได้เช็คอินสาย` (phone couldn't check-in) |

**Computed**: late_min=0; **GROSS = 500.00 THB** — but the note says "สาย" (late). Manual checkin was rounded to exactly 08:30:00 to avoid penalty.

**Question (Q-22)**: Who's allowed to enter manual checkin times? Is rounding to shift-start time intentional or anomalous?

---

## Summary Table

| TC | Scenario | Worker | Late min | Early min | OT hr | Damage | **GROSS THB** |
|---|---|---|---:|---:|---:|---:|---:|
| 01 | Standard, marginally late | `2248cbf1` | 0.65 | 0 | 0 | 0 | **499.32** |
| 02 | Late ~77 min | `21a1ddde` | 77.57 | 0 | 0 | 0 | **419.20** |
| 03 | Early-out 13:00 | `8bb009f9` | 0 | 270 | 0 | 0 | **218.75** |
| 04 | Night shift 17:00-02:00 | `afa3cdcb` | 1.60 | 0 | 0 | 0 | **498.33** |
| 05 | OT before 1.5h | `87b45132` | 0 | 0 | 1.5 | 0 | **640.62** |
| 06 | OT after 2h, late | `2248cbf1` | 89.00 | 0 | 2 | 0 | **594.79** |
| 07 | Sick leave at 10:42 | `e2c3b84e` | 2.47 | 408 | 0 | 0 | **72.43** |
| 08 | Half-day afternoon | (same as 03) | 0 | 270 | 0 | 0 | **218.75** |
| 09 | Damage 500 | `e2e5b9c3` | 0 | 0 | 0 | 500 | **0.00** |
| 10 | Intern (no late penalty) | UNK | 0.88→0 | 0 | 0 | 0 | **500.00** |
| 11 | Housekeeper (no late penalty) | UNK | 0→0 | 0 | 0 | 0 | **500.00** |
| 12 | Manual checkin (phone fail) | `8692390d` | 0 | 0 | 0 | 0 | **500.00** |

CSV with all input/output fields: [`test_cases.csv`](./test_cases.csv)
