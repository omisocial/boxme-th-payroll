# Audit Checklist — Thailand Team
## Checklist ตรวจสอบสำหรับทีมไทย

**Purpose / วัตถุประสงค์**: Confirm assumptions and resolve ambiguities found in `Thailand_Sessonal_Payment.xlsx` before building the new Supabase-backed Seasonal Income Calculator. ยืนยันสมมติฐานและตอบข้อสงสัยจาก Excel ก่อนสร้างระบบใหม่.

**How to use**: For each question, mark `[x]` and add answer in `Answer (TH/EN):` line. Send back to BA team. ให้ทีมไทยตอบในช่อง `Answer:` แล้วส่งกลับ.

---

## A. Daily Rate & Department / อัตราค่าแรง & สังกัด

**Q-1.** [ ] **Confirm flat rate of THB 500/day for ALL workers regardless of department?**
*ยืนยันว่าทุกคนได้ 500 บาท/วัน เท่ากันหมดทุกสังกัดใช่หรือไม่?*
The formula in column AA (`=IF(...,IF(LEFT(TRIM(E),2)="DW",500,500),500)`) returns 500 in every branch. Damage notes also reference "หักในค่าแรง 500".
Answer (TH/EN):

**Q-2.** [ ] **If rates differ, list daily rate (THB) for each code:** BM1, BM2, BM3, BM4, BMN, BMM, DW1, DW2, DW3, DWN, DWM, แม่บ้าน, นักศึกษา, นักศึกษาฝึกงาน.
*ถ้าค่าแรงต่างกัน กรุณากรอกอัตราค่าแรงรายวันของแต่ละสังกัด*
| Code | Daily rate (THB) | Notes |
|---|---|---|
| BM1 | | |
| BM2 | | |
| BM3 | | |
| BM4 | | |
| BMN | | |
| BMM | | |
| DW1 | | |
| DW2 | | |
| DW3 | | |
| DWN | | |
| DWM | | |
| แม่บ้าน | | |
| นักศึกษา | | |
| นักศึกษาฝึกงาน | | |

**Q-3.** [ ] **Are BM2, BM4, BMN, BMM, DW2, DWN, DWM still active codes?** They appear in Members header summary but not in any daily timesheet during Apr 2026. Should the system retire them, or are they used in other months?
*สังกัดเหล่านี้ยังใช้งานอยู่หรือเลิกใช้แล้ว?*
Answer:

**Q-4.** [ ] **DW workers are NOT registered in `Members` master.** Do they have a separate roster, or are they walk-ins? How should the new system enroll them?
*คนงาน DW ไม่ได้บันทึกใน Members — มี master data ที่อื่นหรือเปล่า? วิธี register คนใหม่อย่างไร?*
Answer:

---

## B. Time & Late/Early-Leave Calculation / การคิดสาย & ออกก่อน

**Q-5.** [ ] **Late buffer: is there a grace period (e.g., ≤ 5 min not penalized)?**
*มีระยะอนุโลมการมาสายไหม (เช่น สายไม่เกิน 5 นาทีไม่หัก)?*
Currently formula uses raw decimal minutes; a row arriving 0.65 min late incurs 0.68 THB deduction.
Answer:

**Q-6.** [ ] **Rounding rule for late/early-out minutes**: Round up to the nearest 1, 5, 15, 30 minutes? Or no rounding? At what step is rounding applied (minutes vs THB amount)?
*ปัดนาทีสายแบบไหน: ปัดขึ้น 5/15/30 หรือไม่ปัด? ปัดที่ขั้นไหน (นาทีหรือจำนวนเงิน)?*
Answer:

**Q-7.** [ ] **Confirm: late penalty applies ONLY to BM and DW workers** (not interns, housekeepers).
*ยืนยันว่าหักสายเฉพาะ BM และ DW เท่านั้น?*
Excel formula in V: `=IF(OR(LEFT(E,2)="BM",LEFT(E,2)="DW"),Q,0)`.
Answer:

**Q-8.** [ ] **Are interns paid the same daily rate as BM workers?** They have no late penalty but do they earn 500/day?
*นักศึกษาฝึกงานได้ค่าแรงเท่าไรต่อวัน?*
Answer:

**Q-9.** [ ] **What is `U` (column "ชั่วโมงทำงาน")?** Excel formula returns 5 if shift duration ≤ 6 hr, else 8. Does "5" represent a 5-hour minimum half-day, or is it a divisor for wage_per_minute? Should it be the actual shift duration?
*คอลัมน์ U "ชั่วโมงทำงาน" คืออะไร? ทำไมตอบ 5 หรือ 8 (ไม่ใช่จำนวนชั่วโมงจริง)?*
Answer:

**Q-10.** [ ] **List all valid shift codes** and confirm start/end times. Currently observed: `08:30 - 17:30`, `07:00 - 16:00`, `09:00 - 18:00`, `17:00 - 02:00`. Are there others (split shifts, half-day, weekend)?
*แสดงรายการกะทั้งหมด & ยืนยันเวลาเริ่ม-เลิก*
Answer:

**Q-11.** [ ] **Break time deduction**: Is there an unpaid lunch/break that should be subtracted from worked hours? Currently U is just a categorical 5/8.
*มีเวลาพักไม่จ่ายไหม (เช่น พักเที่ยง 1 ชม.)?*
Answer:

---

## C. Leave Policy / นโยบายการลา

**Q-12.** [ ] **`ลาป่วย` (sick leave) — paid or unpaid?** Currently the early-checkout time is treated as voluntary early leave and deducted, sometimes wiping out 80%+ of the daily wage. Should sick leave be paid? With a max number of paid days/year?
*ลาป่วยจ่ายเงินหรือไม่? ถ้าจ่าย ปีละกี่วัน?*
Answer:

**Q-13.** [ ] **`เข้างานบ่าย` (afternoon-only entry) — half-day pay?** Should this be capped at 50% of daily wage rather than full wage minus huge late penalty?
*ลามาทำงานช่วงบ่ายควรจ่ายครึ่งวัน หรือเต็มลบหักสาย?*
Answer:

**Q-14.** [ ] **`ลากิจ` (personal leave) — paid or unpaid?**
*ลากิจจ่ายเงินไหม?*
Answer:

**Q-15.** [ ] **Column AJ in daily sheet (no header, used in gross-wage formula)**. What does it deduct?
*คอลัมน์ AJ ใน sheet รายวันใช้หักอะไร (ไม่มีหัวคอลัมน์)?*
Answer:

---

## D. OT / โอที

**Q-16.** [ ] **OT multiplier confirmed at 1.5×?** Are there higher multipliers for holidays, weekends, night shift, or double-OT (>4 hours)?
*OT คูณ 1.5 เท่าใช่ไหม? วันหยุด/วันนักขัตฤกษ์ใช้คูณกี่เท่า?*
Answer:

**Q-17.** [ ] **OT before vs OT after** — currently both use the same 1.5× multiplier. Confirm they're treated identically.
*OT ก่อนกับ OT หลังคิดเหมือนกันไหม?*
Answer:

**Q-18.** [ ] **OT minimum unit** — is OT counted in 0.5h, 1h, or 15min increments? What's the minimum chargeable OT?
*OT คิดขั้นต่ำกี่นาที (15/30/60)? *
Answer:

---

## E. Damage Deductions / สินค้าเสียหาย

**Q-19.** [ ] **Resigned worker with outstanding damage** (`ลาออกไปแล้ว`) — write off, or send to collection?
*คนงานที่ออกไปแล้วและยังหักไม่หมด ทำอย่างไร?*
Answer:

**Q-20.** [ ] **`คลังที่` (warehouse #1, #2)** — what do these mean? Different physical sites? Different cost centers?
*คลังที่ 1, 2 หมายถึงคลังไหน?*
Answer:

**Q-21.** [ ] **Linkage from `สินค้าเสียหาย` log to daily AI cell**: Is this purely manual? When status changes from "ยังไม่ได้หักเงิน" to "หักเงินแล้ว", who copies amount into which day's AI?
*การเชื่อม sheet สินค้าเสียหาย กับ AI ใน sheet รายวัน — ทำมือทั้งหมดหรือมีระบบ?*
Answer:

---

## F. Operational Edge Cases / กรณีพิเศษ

**Q-22.** [ ] **Manual checkin (`โทรศัพท์เข้าแอปไม่ได้เช็คอิน`)** — who enters the time, who approves it, what's the audit trail?
*เคสที่แอป checkin ไม่ได้ — ใครกรอกให้, ใครอนุมัติ, มีการ audit ไหม?*
Answer:

**Q-23.** [ ] **Missing checkout (worker forgot to clock out)** — what's the policy? Pay nothing, pay full, pay until last seen, ask supervisor?
*คนงานลืม checkout ทำอย่างไร?*
Answer:

**Q-24.** [ ] **Night-shift late detection** for shift `17:00 - 02:00` — is the current Excel formula correct? It compares time-of-day only and could mis-classify a 17:05 checkin (5 min late) vs a 02:05 checkin (way past shift end). Please confirm with a test case.
*การคิดสายของกะดึก ถูกต้องไหม?*
Answer:

**Q-25.** [ ] **What is the canonical worker identity field?** Full name? Thai national ID? Phone? An employee number?
*ใช้ field อะไรเป็น primary key ของพนักงาน?*
93 nicknames are duplicated; full names are typed manually so prone to typos.
Answer:

**Q-26.** [ ] **Date format in start_date and damage log**: Some are Buddhist (พ.ศ. 2569), some Gregorian (2026), some `dd/mm/yy`. Should the new system display in พ.ศ. or ค.ศ.? Internal storage should be ISO Gregorian — confirm OK.
*แสดงวันที่ใน UI เป็น พ.ศ. หรือ ค.ศ.?*
Answer:

---

## G. System Integration / การเชื่อมระบบ

**Q-27.** [ ] **Boxme WMS API for check-in events** — does the WMS already record worker check-in events? Endpoint? Authentication? Sample payload? Or is the mobile app the only source?
*WMS เก็บ checkin ของพนักงานไหม? API endpoint อะไร?*
Answer:

**Q-28.** [ ] **Bank export file format per bank** (K-BANK, SCB, BBL, KTB, BAY, GSB, TTB, KKP, BAAC, UOB) — share an example file for each. Field separator, date format, account length, file extension.
*แต่ละธนาคารใช้ format อะไร? กรุณาส่งตัวอย่างไฟล์ของแต่ละแบงค์*
Answer (attachments):

**Q-29.** [ ] **Missing day sheets (6, 13, 14, 15, 31)** — were those non-working days, or were sheets accidentally deleted?
*วันที่หายไป (6, 13, 14, 15, 31) — เป็นวันหยุดหรือลบ sheet ไป?*
Answer:

**Q-30.** [ ] **Result sheet's broken VLOOKUP** (uses col 27/28 instead of 32/33). Is anyone actually using Result, or is it dead?
*Sheet Result ใช้งานอยู่หรือเปล่า? สูตร VLOOKUP ผิดคอลัมน์*
Answer:

**Q-31.** [ ] **Existing payroll review approval flow**: Who approves daily timesheets? Manager? HR? Both? At what frequency (daily, weekly, monthly)?
*Flow approval ปัจจุบัน — ใครอนุมัติ และอนุมัติบ่อยแค่ไหน?*
Answer:

---

## H. Data Privacy & Security / ความปลอดภัยข้อมูล

**Q-32.** [ ] **PDPA-compliant storage of bank account & ID number in Supabase** — confirm OK to store bank account # in plaintext (encrypted at rest), or must it be tokenized? Should national ID be stored at all?
*เก็บเลขบัญชีและบัตรประชาชนใน Supabase ตามกฎ PDPA — เก็บแบบไหน?*
Answer:

**Q-33.** [ ] **Who can see which fields?** RBAC matrix — e.g., HR sees full bank, supervisor sees masked, payroll team sees full.
*ใครเห็น field ไหนได้บ้าง?*
Answer:

**Q-34.** [ ] **Retention policy** — how long do we keep daily timesheets and bank exports?
*เก็บข้อมูลย้อนหลังกี่ปี?*
Answer:

---

## I. Versioning / Effective Dates

**Q-35.** [ ] **Did the daily rate change** between months/years? If yes, share the history (2024-Q1: 480, 2024-Q4: 500, etc.) so the `rate_configs` table has correct effective_from/effective_to.
*อัตราค่าแรงเคยเปลี่ยนไหม? ขอประวัติการปรับอัตรา*
Answer:

**Q-36.** [ ] **Did OT multiplier change** historically?
*อัตราคูณ OT เคยเปลี่ยนไหม?*
Answer:

---

## J. Migration & Reconciliation / การย้ายข้อมูล

**Q-37.** [ ] **Migration scope** — import historical X months of timesheets into Supabase, or start fresh from go-live?
*Import ย้อนหลังกี่เดือน หรือเริ่มจาก 0?*
Answer:

**Q-38.** [ ] **Reconciliation period** — for the first month after go-live, run both Excel and Supabase in parallel? How long?
*Run คู่ขนานกี่เดือน?*
Answer:

---

**Total questions: 38** — please respond by **<deadline TBD>**. Block all engineering work until §A–§D are answered (these are required for any spec finalization).
