# OpenSpec — Boxme Seasonal Income Calculator

This folder follows OpenSpec convention: capabilities are stable specifications; changes are proposals to extend/modify capabilities.

```
openspec/
├── README.md                       ← this file
├── capabilities/
│   └── seasonal-payroll/
│       ├── spec.md                 ← capability specification (root)
│       ├── multi-country.md        ★ v0.2 — country/warehouse/holiday config
│       ├── compensation.md         ★ v0.2 — configurable comp components & rules
│       ├── work-limits.md          ★ v0.2 — legal work-time limits
│       ├── default-configs.md      ★ v0.2 — audit-Q's converted to defaults
│       ├── phased-roadmap.md       ★ v0.2 — MVP → Phase 4 plan
│       ├── data-model-v2.md        ★ v0.2 — current schema (multi-country, config-driven)
│       ├── data-model.md           ▲ v0.1 — superseded; kept for reference
│       ├── formulas.md             ← canonical payroll math
│       ├── api.md                  ← endpoint surface
│       ├── use-cases.md            ← user flows
│       └── edge-cases.md           ← edge case catalogue
└── changes/                        ← (empty — no change proposals yet)
```

★ = added/updated in v0.2.

---

## What changed in v0.2

| Concern | v0.1 (Apr 30) | v0.2 (Apr 30 — same day update) |
|---|---|---|
| Geographic scope | TH only | **Multi-country** (TH active, VN+PH inactive but data-model ready) |
| Pay structure | Hard-coded 5 components | **Configurable component + rule engine** — HR adds an allowance with one DB row |
| Worker classification | Department only | + worker_grade + job_type (Phase 3) |
| Audit-Q answers | 38 questions team must fill | **38 defaults pre-seeded**; team only overrides what's wrong |
| Legal limits | Not modeled | `legal_limits` table with TH/VN/PH defaults |
| Roadmap | Single "v1" | 4 phases — Phase 1 MVP scope explicitly bounded |
| Holidays | Not modeled | `holidays` table with multipliers |
| Currency | THB-only | Polymorphic; each country has currency_code |

The v0.1 docs (`data-model.md`) remain for diff/audit purposes but should not be implemented as-is.

---

## Status

**DRAFT v0.2** — pending Audit Checklist (`../analysis/02_audit_checklist.md`) responses from Thailand operations team. Defaults are reasonable starting points but team confirmation is still required for §A–§D before MVP development starts.

DRAFT v0.2 — รอคำตอบจากทีมไทยใน Audit Checklist ก่อน. ค่า default พร้อมใช้แล้ว ทีมแค่เลือก "ยืนยัน" หรือ "ปรับ".

---

## Reading order

For BA / PM:
1. `spec.md` — scope & success criteria
2. `phased-roadmap.md` — what ships when
3. `default-configs.md` — what TH team must confirm/override

For engineering:
1. `spec.md`
2. `data-model-v2.md`
3. `formulas.md`
4. `compensation.md`
5. `multi-country.md` + `work-limits.md`
6. `api.md`, `use-cases.md`, `edge-cases.md`

For Thailand operations team:
1. `../analysis/01_analysis_report.md` (in TH/EN)
2. `../analysis/02_audit_checklist.md` (in TH/EN) — answer / confirm / override
3. `default-configs.md` — see what defaults will apply
4. `phased-roadmap.md` — see what to expect first
