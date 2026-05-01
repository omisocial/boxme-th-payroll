# Boxme Thailand — Seasonal Payroll: Analysis Report
## รายงานการวิเคราะห์ระบบเงินเดือนพนักงานชั่วคราว Boxme Thailand

**Source / แหล่งข้อมูล**: `Thailand_Sessonal_Payment.xlsx`
**Author / ผู้จัดทำ**: Senior BA, Boxme Vietnam (Mark)
**Date / วันที่**: 2026-04-30
**Status / สถานะ**: DRAFT — pending Thailand team audit / รอทีมไทยตรวจสอบ
**Privacy / ความเป็นส่วนตัว**: All real names, phones, bank accounts have been replaced by `worker_id` (8-char salted hash). Mapping table is kept in `private/worker_id_map.csv` and is NOT part of any deliverable. / ข้อมูลส่วนตัวทั้งหมด (ชื่อ-สกุล, เบอร์โทร, เลขบัญชี) ถูก hash เป็น `worker_id`

---

## 1. Executive Summary / สรุปสำหรับผู้บริหาร

The Excel workbook is **a daily-timesheet-driven payroll template** with one master sheet (`Members`), one aggregation sheet (`Result`, currently broken/stale), one deduction log (`สินค้าเสียหาย`), and 29 daily timesheet sheets (`วันที่ 1` … `วันที่ 30`, with night-shift variants `กะดึก`). Daily wage formulas use a uniform **THB 500 per day** rate hard-coded in column `AA`, OT paid at **1.5×** hourly rate, and late/early-leave deductions calculated as `wage_per_minute × minutes_off`. Late penalties apply **only** to BM and DW employees — interns (นักศึกษา) and housekeepers (แม่บ้าน) are exempt. The workbook in its current state has **no cached computed values** (Excel calculation was never saved), so any downstream audit must rely on re-computation.

ไฟล์ Excel เป็น **template คำนวณเงินเดือนรายวัน** ประกอบด้วย Members (master), Result (template รวม — สูตรไม่ทำงาน), สินค้าเสียหาย (log หักเงิน), และ 29 sheets รายวัน (วันที่ 1–30 + กะดึก). อัตราค่าแรง **500 บาท/วัน** ถูก hard-code, OT ที่ **1.5×**, หักสายและออกก่อนตามนาที. หักเฉพาะ BM/DW เท่านั้น (นักศึกษา + แม่บ้าน ยกเว้น). ไฟล์นี้ **ไม่มีค่า cached** จาก Excel จึงต้องคำนวณใหม่ทั้งหมด.

---

## 2. Workbook Inventory / สรุป Sheet ทั้งหมด

| # | Sheet name (Thai) | Role / หน้าที่ | Workers / จำนวนพนักงาน | Has cached values? |
|---|---|---|---:|---|
| 1 | `Members` | Master data — 535 worker records (ID, full name, nickname, phone, bank account, bank code, สังกัด, start date) | 535 | Partial (formulas in col G "BANK NAME" return None) |
| 2 | `Result` | Aggregation template (one row per worker × 31 day columns × 2 metrics) — **formula appears broken**, references stale sheets like `'กะเช้าวันที่ 12'` not in workbook | 96 | None — empty |
| 3 | `สินค้าเสียหาย` | Damage deduction log — 20 rows of incidents | 20 | Yes |
| 4–32 | `วันที่ 1` … `วันที่ 30` (and `กะเช้า`/`กะดึก` splits for days 3, 4, 5) | Daily timesheet — checkin/checkout, late/early-leave, OT, damage, gross wage | 50–90 per day | None — formulas not calculated |

**⚠️ Missing days / วันหายไป**: Days 6, 13, 14, 15, 31 are NOT present in the workbook. Either no work happened (e.g., Sunday) or sheets were not migrated. Result sheet's VLOOKUPs reference these as `IFERROR(..., 0)` so missing sheets silently become zero. **Audit Q-29.**

**⚠️ Result sheet broken / Sheet Result มีปัญหา**: The Result aggregation formula uses VLOOKUP column index 27 and 28 of range `$B$8:$AH$103`. Counting from B, position 27 = column AB (OT-before time text) and position 28 = AC (OT-before hours number). The intended target was likely AG (OT pay) and AH (gross wage) at positions 32/33. **Result sheet output cannot be trusted.** This must be repaired or replaced. **Audit Q-30.**

---

## 3. Daily Timesheet — Column-by-Column Logic
## รูปแบบ Sheet รายวัน — ตีความสูตรทุกคอลัมน์

Each daily sheet has the same fixed structure: rows 1–7 are department-level summary (BM1 count, BM wages, etc.); row 8 is the header; rows 9 onward are worker rows. ทุก sheet รายวันมีโครงสร้างเดียวกัน: แถว 1–7 สรุปตามสังกัด, แถว 8 คือ header, แถว 9+ เป็นรายชื่อพนักงาน.

| Col | Header (Thai) | English meaning | Formula (extracted) | Notes / หมายเหตุ |
|---|---|---|---|---|
| A | ลำดับ | Sequence number | manual | — |
| B | ชื่อ-นามสกุล | Full name | manual | **Lookup key** for VLOOKUPs / **คีย์หลัก** |
| C | Checkin time | Check-in datetime | manual | Sometimes typed manually when app fails (`โทรศัพท์เข้าแอปไม่ได้เช็คอิน`) |
| D | Checkout time | Check-out time | manual | May be missing |
| E | Note | Department/role code | manual | Values: `BM1`, `BM3`, `DW1`, `DW3`, `นักศึกษา`, `นักศึกษาฝึกงาน`, `แม่บ้าน` (+ variants & typos) |
| F | ชื่อเล่น | Nickname | manual | Free text — collisions exist (see §6) |
| G–J | bank info | bank info | `=VLOOKUP(B,Members!$B:$G,3,0)` … (cols 3–6) | Pulls from Members |
| K | หมายเหตุ | Manual note | manual | Sick/leave reasons (`ลาป่วย`, `ลาบ่าย`, `ลาไปหาหมอ`, `OT 2`, etc.) |
| L | ตรวจสอบ BM | BM department crosscheck | `=IF(ISNUMBER(SEARCH("BM",E)),IFERROR(VLOOKUP(B,Members!$B:$H,7,FALSE),""),"")` | Verifies E matches Members.สังกัด |
| M | นาทีที่เลิกก่อน | Early-out text label | `=IF(D<T,"ออกก่อน "&TEXT((T-D)*1440,"0")&" นาที","")` | Display only |
| N | นาทีที่เลิกก่อน *(misnamed)* | Checkin text | `=TEXT(C,"hh:mm:ss")` | Display only |
| O | นาทีที่เลิกก่อน *(misnamed)* | Checkin time-of-day | `=TIMEVALUE(LEFT(N,5))` | Used for late comparison |
| P | สาย (นาที) | Late text label | `=IF(MOD(S)>=MOD(O),"ตรงเวลา","มาสาย "&ROUND((MOD(O)-MOD(S))*1440,0)&" นาที")` | Display only — uses ROUND |
| Q | สาย | Late minutes (number) | `=IF(S<=O,(O-S)*1440,0)` | **Decimal precision** — no rounding |
| R | กะการทำงาน | Shift code | manual | `08:30 - 17:30`, `07:00 - 16:00`, `17:00 - 02:00`, `09:00 - 18:00` |
| S | เวลาเริ่ม | Shift start time | `=TIMEVALUE(LEFT(R,5))` | Parses from R |
| T | เวลาเลิก | Shift end time | `=TIMEVALUE(RIGHT(R,5))` | Parses from R |
| U | ชั่วโมงทำงาน | "Hours worked" bucket | `=IF(IF(T<S,(T+1-S)*24,(T-S)*24)<=6,5,8)` | **CATEGORICAL: 5 or 8** — not actual hours. Crosses-midnight handled by `T+1`. |
| V | นาทีที่หักจริง | Late minutes deducted | `=IF(OR(LEFT(E,2)="BM",LEFT(E,2)="DW"),Q,0)` | **Late penalty applies ONLY to BM/DW**, not interns/housekeepers |
| W | จำนวนเงินหักสาย | Late deduction (THB) | `=(AA/U)/60*V` | `wage_per_minute × late_minutes_deducted` |
| X | นาทีที่ออกก่อน | Early-out minutes | `=IF(D<T,(T-D)*1440,0)` | Decimal minutes |
| Y | ค่าแรง/นาที | Wage per minute | `=(AA/U)/60` | `daily_rate / (U×60)` |
| Z | จำนวนเงินหักออกก่อน | Early-out deduction (THB) | `=X*Y` | Always applies (no BM/DW filter) |
| AA | ค่าแรง | Daily rate (THB) | `=IF(AND(T>=S,S>=TIME(9,0,0),T<=TIME(15,0,0)),IF(LEFT(TRIM(E:E$208),2)="DW",500,500),500)` | **All branches return 500** — placeholder. Confirmed by damage note "หักในค่าแรง 500" |
| AB | OT ก่อน (เวลา) | OT-before time-string | manual, e.g. `'07:00-08:30'` | Display only |
| AC | OT ก่อน (จำนวนชม.) | OT-before hours | manual, e.g. `1.5` | Numeric — used in OT pay |
| AD | OT หลัง (เวลา) | OT-after time-string | manual | Display only |
| AE | OT หลัง (จำนวนชม.) | OT-after hours | manual | Numeric |
| AF | รวม OT | Total OT hours | `=+AC+AE` | Sum of OT-before & OT-after |
| AG | ค่าแรง OT | OT pay (THB) | `=(AA/U)*1.5*AF` | `hourly_rate × 1.5 × total_OT_hours` |
| AH | รวมค่าแรง | **Gross wage (THB)** | `=(AA-W-Z-AI-AJ)+AG` | `daily − late_ded − early_ded − damage − other_ded + OT_pay` |
| AI | หักสินค้าชำรุด | Damage deduction | manual | Linked logically to `สินค้าเสียหาย` log |
| AJ | (no header) | Other deduction | manual | Used in AH but no header — **investigate. Audit Q-15.** |

---

## 4. Derived Payroll Formula (Canonical)
## สูตรเงินเดือนหลัก (สรุป)

```
shift_start  S = parse(R, "HH:MM")
shift_end    T = parse(R, "HH:MM-HH:MM" → second token)
shift_duration = (T - S) hours  (T+1 if crosses midnight)
U (hours bucket) = 5 if shift_duration ≤ 6 else 8

late_min Q     = max(0, checkin_time - S) in minutes      [decimal]
late_apply V   = Q if dept ∈ {BM*, DW*} else 0
early_min X    = max(0, T - checkout_time) in minutes
wage_per_min Y = AA / (U × 60)
late_ded W     = Y × V
early_ded Z    = Y × X

ot_pay AG      = (AA/U) × 1.5 × (AC + AE)   # OT_multiplier = 1.5
damage AI      = manual entry (THB)
other AJ       = manual entry (THB)  [purpose unclear]

GROSS AH       = (AA − W − Z − AI − AJ) + AG
```

**Where AA (daily rate)** is currently a formula returning `500` for all branches — i.e., flat 500 THB per worker per day. This is corroborated by manager notes in the damage log (e.g., "หักในค่าแรง 500 ขาดอีก 530.05"). However:

- The formula's *intent* clearly attempted to differentiate by shift length and DW vs non-DW — but both branches return 500. **Either**: (a) all rates truly are 500 THB during this period, (b) the formula was never finished, or (c) team manually overrides AA. **Audit Q-1, Q-2.**

---

## 5. Shift Catalogue / รายการกะการทำงาน

Observed in workbook / พบในไฟล์:

| Shift code | Start | End | Crosses midnight? | Bucket U |
|---|---|---|---|---|
| `08:30 - 17:30` | 08:30 | 17:30 | No | 8 |
| `07:00 - 16:00` | 07:00 | 16:00 | No | 8 |
| `09:00 - 18:00` | 09:00 | 18:00 | No | 8 |
| `17:00 - 02:00` | 17:00 | 02:00 | **Yes** | 8 (9 raw hr → bucket 8) |

Shorter shifts (≤ 6 hours, e.g., a half-day shift) would map to bucket **U = 5**, but no such shift was observed in active data. **Audit Q-9, Q-10.**

---

## 6. Master Data Quality (Members) / คุณภาพข้อมูล Members

Total rows: 989; Worker records (col B populated): **535**

| Issue | Count | Example | Action |
|---|---:|---|---|
| Phone format inconsistency | ~38 distinct format patterns | `'XXXXXXXXXX`, `' XXXXXXXXXX`, `XXXXXXXXXX`, `-` (leading apostrophe variants, leading space, plain digits, dash placeholder) | Normalize to digits-only, last-4 mask in deliverables |
| Bank account empty | tens | (blank) | Treat as `unknown` and exclude from bank export |
| Start-date stored as **datetime** | 106 | `2025-03-11 00:00:00` | OK |
| Start-date stored as **string** | 274 | `29/11/2025`, `13/1/2026` | Parse with `DD/MM/YYYY` |
| Start-date is **non-date text** | a few | `แม่บ้านพี่เก` (a name) | Manual cleanup |
| Start-date typo | 1 known | `28/1/6026` (per task brief — not currently in file) | Clean to `28/1/2026` |
| Start-date Buddhist year | observed in damage notes | `2569` | Subtract 543 to get Gregorian |
| Department (สังกัด) = `BM*` only | 498 | BM3 dominant | **No DW workers in Members** — see §7 |
| Duplicate nicknames | **93** | One nickname has **7 different workers**, several have 4–6 | **Cannot use nickname as join key** |

### Nickname collision impact / ผลกระทบของชื่อเล่นซ้ำ

Out of 535 workers, 93 nicknames are shared by 2+ people; the top collision is shared by 7 workers. Daily sheets currently use **full name (`B`) → VLOOKUP → Members**, which works only when full name is exactly typed. We need a stable `worker_id` (e.g., national ID hash, employee number, or salted SHA-256 of full_name+phone) for any DB design.

---

## 7. Department Catalogue / รายการสังกัด

### Members.สังกัด (master data)
- `BM1` (106), `BM2` (8), `BM3` (308), `BM4` (43), `BMN` (33). **No DW, no แม่บ้าน, no นักศึกษา.**

### Daily timesheet `Note` column (actual usage)
- `BM1` (762), `BM3` (672), `DW1` (237), `DW3` (35)
- `นักศึกษา` (45), `นักศึกษาฝึกงาน` (41), `นักศึกษาแบงค์` (5), `นศ.ฝึกงาน` (1), `นักศึกษาฝึกงานชั่วคราว` (1)
- `แม่บ้านสา` (16), `แม่บ้าน` (12), `แม่บ้านชม้อย` (10), `แมบ้าน` (1 — typo)
- Case typos: `Bm1` (17), `Dw3` (2)

**⚠️ Department codes referenced in original brief (BM2, BM4, BMN, BMM, DW2, DWN, DWM)** do not appear in any daily sheet during this period. They exist only in Members or in daily-sheet header summary cells. **Audit Q-3.**

**⚠️ DW workers are NOT in Members master.** They appear inline in daily sheets but were never registered. This is a master-data gap. **Audit Q-4.**

---

## 8. Damage Deductions (สินค้าเสียหาย)

**Structure** (cols A–I): No., full name, nickname, dept, amount (THB), warehouse, status, ผิดวันที่ (incident desc), หักวันที่ (deduction date desc).

**Status values** (cols G actually contains status; col H/I free-text):
- `หักเงินแล้ว` — already deducted
- `ยังไม่ได้หักเงิน` — not yet deducted

**Special handling cases observed**:
- **Multi-day split**: `913.82 ให้หัก 3 วัน วันที่ 11.03.69 หักแล้ว 294.60 ต้องหักอีก…` — large amounts split across days
- **Outstanding for resigned worker**: `ไม่ได้หักเนื่องจากลาออกไปแล้ว` — worker resigned before deduction completed → write-off?  **Audit Q-19.**
- **Date format mix**: `13/11`, `04/03/69`, `25/02/69`, `2569-09-04 00:00:00`, `7 มีนาคม` — Buddhist (พ.ศ.) and Gregorian, partial dates, Thai month names
- **Warehouse**: integer `1` or `2` (warehouse #) — semantics from team **Audit Q-20.**

**Linkage to daily timesheet `AI` (หักสินค้าชำรุด)**: Currently informal — the manager manually copies amounts from this log into the relevant `วันที่ X` row's AI cell when status changes to `หักเงินแล้ว`. There is no foreign key / formula link. **Audit Q-21.**

---

## 9. Edge Cases Catalogue / ตัวอย่างกรณีพิเศษที่พบ

### Time / เวลา

1. **Manual checkin** when phone app fails — note `โทรศัพท์เข้าแอปไม่ได้เช็คอิน*` — manager enters time manually (e.g. exactly `08:30:00`). No audit trail of who entered. **Q-22.**
2. **Missing checkout** — some rows have only checkin → gross wage formula returns `((T-D)*1440)` where D=`None`, error → IFERROR=0 → wage stays 500. Likely *wrong* — should treat as absent. **Q-23.**
3. **Crosses-midnight night shift** (`17:00 - 02:00`) — formula uses `T+1` correctly for hours_worked but late/early-out formulas use raw `O` and `T` time-only — **must verify late detection works for shifts where checkin time-of-day < S** (e.g., past midnight checkin to a morning shift). **Q-24.**
4. **Late minutes are decimal** (e.g. 0.65 min, 77.57 min) — no buffer, no rounding. **Q-5.**

### Leave / การลา

5. `ลาป่วย` (sick leave): manager treats as voluntary early-out — entire afternoon deducted as `early_out_minutes × wage_per_min`. **Should sick leave be paid?** **Q-12.**
6. `ลาป่วยกลับบ้าน 10:42` — checkout actually entered at 10:42 → 408 min early-out → 425 THB deducted → effective wage 72.43 THB. Aggressive penalty for sickness.
7. `ลาบ่าย`, `ลางานช่วงบ่าย`, `แจ้งลางานช่วงบ่าย`, `ลากลับ 15:00` — same treatment (treated as early-out).
8. `เข้างานบ่าย` — late afternoon checkin → would compute as huge late minutes, but no observed cases of full-day late deduction. **Q-13.**
9. `ลาไปหาหมอ` (medical visit) — same as sick leave?
10. `ลากิจไปทำธุระ` (personal leave) — treated as early-out. Should this be unpaid leave? **Q-14.**

### Worker classification / การจำแนก

11. Interns and housekeepers exempt from late penalty (V=0) but still receive 500 THB if they checkin/out. Confirm interns are paid daily, not stipend. **Q-7, Q-8.**
12. `ลาออกไปแล้ว` (already resigned) workers in damage log — outstanding balance handling. **Q-19.**

### Data integrity / ความสมบูรณ์ของข้อมูล

13. Missing days 6, 13, 14, 15, 31 — no sheet, Result formula silently zero.
14. Result sheet uses wrong column indices (27, 28) instead of (32, 33) — output is junk.
15. AA daily-rate formula is degenerate (always 500) — confirm flat rate.
16. AJ "other deduction" used in AH but has no header — purpose unknown. **Q-15.**

---

## 10. Limitations of This Analysis / ข้อจำกัด

1. **No cached values in workbook** — Excel formulas were never resolved at save time, so we cannot cross-check our derived formula against actual gross wage column AH for any row. All test cases (§ test_cases.csv) report `cached_gross_AH = None`. The team must validate against their *manual* payment records.
2. **Daily rate uniformity** — our re-computation assumes flat 500 THB. If different in practice (e.g. supervisors get 600, interns 300), every figure shifts proportionally.
3. **Missing days** could indicate the Excel was a partial export — not the source of truth.
4. **Result sheet broken** — cannot use it as a reconciliation target.
5. **Buddhist-vs-Gregorian** dates and Thai-language manual entries require domain knowledge to interpret correctly; we have flagged but not auto-corrected.

---

## 11. Recommended Next Steps / ขั้นตอนต่อไปที่แนะนำ

1. **Run the Audit Checklist** with the Thailand operations team (file: `02_audit_checklist.md`). Block all spec-finalization on receiving answers.
2. Have Thailand team open the workbook in Excel and **save with formulas calculated** (or paste-values into a copy) so we can reconcile our derived numbers against actuals.
3. Reconfirm flat-rate THB 500/day by comparing against the most recent month's bank-payment file (the actual bank file, not Excel).
4. Receive a sample **bank export file** for each bank (K-BANK, SCB, BBL, KTB, BAY, GSB, TTB, KKP, BAAC, UOB) so the OpenSpec can describe the export format precisely.
5. Receive Boxme WMS API documentation for any potential check-in integration.

---

## See also / เอกสารอ้างอิง

- `02_audit_checklist.md` — numbered questions for Thailand team
- `03_test_cases.md` (+`test_cases.csv`) — 12 worked examples
- `04_glossary.md` — Thai/English/Vietnamese terminology
- `../openspec/` — Capability spec for the Seasonal Income Calculator
