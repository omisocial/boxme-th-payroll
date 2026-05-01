# Capability: Seasonal Income Calculator (Boxme — multi-country)

**Status**: DRAFT v0.2 — pending audit
**Owner**: Boxme Vietnam BA team (Mark) + Boxme Thailand operations (lead) + Boxme VN, PH ops (later phases)
**Last updated**: 2026-04-30

---

## 1. Purpose / วัตถุประสงค์ / Mục đích

Replace the manual `Thailand_Sessonal_Payment.xlsx` workflow with a **multi-country, configuration-driven** Supabase-backed application. Boxme TH is the pilot; Boxme VN and Boxme PH onboard in later phases without code changes.

ทดแทน Excel ด้วยระบบที่ **กำหนดค่าได้ทั้งหมด** รองรับหลายประเทศ (TH → VN → PH) — เพิ่มประเทศใหม่ด้วยการตั้งค่า ไม่ใช่แก้โค้ด.

Thay thế quy trình Excel thủ công bằng một hệ thống **đa quốc gia, cấu hình hoá** trên Supabase. Boxme TH triển khai trước; sau đó VN và PH onboard mà không cần đổi code.

The system:

1. **Imports daily timesheets** — Excel upload (preserves current Thailand format), manual web form, or Boxme WMS API.
2. **Computes pay** as a sum of configurable **components** (base wage, OT, allowances, bonuses, deductions) — each resolved by rules scoped to country × warehouse × department × shift × grade × job × time.
3. **Aggregates by pay period** (weekly, bi-weekly, or monthly).
4. **Enforces legal work-time limits** per country (max hrs/day, OT/week, OT/month, OT/year).
5. **Exports bank payment files** per bank-specific format (TH: 10 banks; VN: ~6; PH: ~5).
6. **Provides admin** for rates, allowances, departments, shifts, grades, job types, workers, damages — all data-driven, no engineering needed for routine changes.

## 2. Scope / ขอบเขต / Phạm vi

> **Phase-driven**. Each phase ships standalone value. See `phased-roadmap.md` for full plan.

### MVP (Phase 1) — TH only — focus on Excel import + daily calc
- Worker master data CRUD (single country)
- Department, shift catalogue (seeded from Excel)
- **Excel import** of `วันที่ X.xlsx` daily timesheets (preserves current team workflow)
- Manual timesheet web form
- Daily payroll computation (base_wage, OT, late/early-out/damage deductions) — **only 5 compensation components**
- Damage deductions log + multi-day scheduling
- Period aggregation (monthly close)
- Bank file export — 2 banks (K-BANK, SCB) for MVP, rest in 1.1
- Audit log
- RBAC (HR admin / supervisor / viewer)
- **Defaults Confirmation page** — Thailand team confirms 38 audit-Q defaults in the UI
- TH-only scope; data model already supports VN/PH but inactive

### Phase 2 — Allowances, holidays (TH)
- Compensation components engine fully active
- Allowances: meal, transport, night premium, attendance bonus, holiday premium
- Holiday calendar (TH public + company)
- Sick / personal / half-day leave policy configurable
- Buddhist calendar UI toggle
- Mobile checkin via Boxme WMS API (if available)
- Itemized payslip
- Dashboard (KPIs, weekly trend)

### Phase 3 — VN expansion + worker grades + job types
- VN country profile + VND
- Worker grades (NEW / SENIOR / LEAD), job types (PICKING / PACKING / LOADING / INVENTORY)
- Multi-warehouse with cross-warehouse transfers
- Cross-country reporting (FX-aware)
- What-if simulator

### Phase 4 — PH expansion + tax engine
- PH country profile + PHP
- Tax withholding (TH PND-1, VN income tax, PH BIR Form 2316)
- Social security (TH SSO, VN BHXH, PH SSS+PhilHealth+Pag-IBIG)
- 13th-month pay
- PH special holiday rules

### Out-of-scope (any phase)
- Worker self-service mobile app (Phase 5 backlog)
- Biometric attendance devices (backlog)
- HRIS integration / API for external systems (backlog)

## 3. Stakeholders / ผู้มีส่วนได้เสีย

| Role | Responsibility |
|---|---|
| Boxme Thailand HR | Approve workers, set rates, run payroll |
| Shift supervisor | Enter daily timesheets, validate manual checkins |
| Warehouse manager | Log damage incidents |
| Finance | Generate bank export, reconcile |
| Boxme Vietnam BA | Spec & oversee implementation |

## 4. Constraints / ข้อจำกัด

- **PDPA-compliant** (Thai Personal Data Protection Act): bank account, ID number, phone are PII — encrypt at rest, mask in UI for non-HR roles, audit access.
- **Thai-language UI** primary; English secondary for BA/dev team.
- **Buddhist calendar** display option (พ.ศ. = year + 543) but Gregorian internal storage.
- **No code is being written yet** — this spec only.
- All assumptions must trace back to a question in `analysis/02_audit_checklist.md`.

## 5. Success Criteria / เกณฑ์ความสำเร็จ

- [ ] All 12 reference test cases (`analysis/03_test_cases.md`) compute correctly per team-validated formulas.
- [ ] First parallel-run month: Excel total vs. system total matches within 0.01 THB per worker per day.
- [ ] Bank export for all 10 banks accepts the file on first upload (no rejected records).
- [ ] HR can complete a full pay-period close in < 1 hour (vs. ~1 day with Excel).
- [ ] Audit trail answers "who changed worker X's checkout time on day Y?" within < 5 sec.

## 6. Cross-references

### v0.2 specs (this folder)
- `data-model-v2.md` — multi-country, configurable Supabase schema (current)
- `multi-country.md` — country/warehouse/holiday/limits structure
- `compensation.md` — configurable compensation components & rules
- `work-limits.md` — legal max-hour rules per country
- `default-configs.md` — TH defaults, mapped from audit checklist
- `phased-roadmap.md` — Phase 1 MVP through Phase 4 expansion
- `formulas.md` — canonical payroll math
- `api.md` — endpoint surface
- `use-cases.md` — user flows
- `edge-cases.md` — defensive scenarios
- `data-model.md` — v0.1 schema (superseded by `data-model-v2.md`)

### Analysis (parent folder)
- `../../../analysis/01_analysis_report.md` — source-data analysis (Excel reverse-engineering)
- `../../../analysis/02_audit_checklist.md` — 38 audit questions
- `../../../analysis/03_test_cases.md` — 12 worked test cases
- `../../../analysis/04_glossary.md` — TH/EN/VI terminology
