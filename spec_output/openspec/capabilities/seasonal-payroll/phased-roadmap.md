# Phased Development Roadmap / Lộ trình triển khai theo giai đoạn

> **MVP-first principle**: Ship a working TH-only daily-payroll system before any allowances, multi-country, or grade complexity. Each phase delivers business value standalone — no big-bang launch.

## Phase 0 — Spec & sign-off (NOW)

**Duration**: 2–3 weeks
**Owner**: Boxme VN BA + Boxme TH operations

**Deliverables**:
- ✅ Reverse-engineered Excel logic (`analysis/01_analysis_report.md`)
- ✅ Audit checklist (38 questions) — Thailand team confirms or overrides defaults
- ✅ OpenSpec v0.2 (this document)
- ✅ 12 reference test cases + actual paid amounts from team
- 🔜 Sample bank export files for all 10 banks
- 🔜 Confirmation of MVP scope & timeline

**Exit criteria**:
- §A (rates), §B (time/late), §C (leave), §D (OT) of audit checklist confirmed.
- At least 1 sample bank file received.

---

## Phase 1 — MVP / TH only / Core daily payroll

**Duration**: 4–6 weeks
**Goal**: Replace the manual Excel workflow for Boxme TH with a working web app.

### In-scope
| Capability | Notes |
|---|---|
| Worker master data CRUD | Single warehouse (TH-BKK-1, TH-BKK-2 hard-coded for now) |
| Department & shift catalogue | 4 shifts seeded; departments BM1/BM3/DW1/DW3/แม่บ้าน/นักศึกษาฝึกงาน |
| **Excel import** of `วันที่ X.xlsx` daily timesheets | Preserves existing team workflow; row-by-row preview before save |
| Manual timesheet web form | For app-failure / corrections |
| **Daily payroll computation** | base_wage + late_deduction + early_out_deduction + ot_pay + damage_deduction (as Excel) |
| Damage deductions log | With multi-day schedule support |
| Period aggregation | Monthly close |
| Bank export (1–2 banks max in MVP) | K-BANK + SCB likely; others added in 1.1 |
| Audit log | Who edited what when |
| RBAC (HR admin / supervisor / viewer) | Simple 3-role |
| Defaults confirmation page | TH team confirms 38 audit-Q defaults in UI |

### Out-of-scope (deferred)
- Allowances, night premium, attendance bonus → Phase 2
- Worker grades / job types → Phase 3
- VN, PH → Phase 3, 4
- Mobile app / WMS API → Phase 2 (if API doc available)
- Tax / social security calculations → Phase 4
- Fancy reporting dashboard (Phase 1 has only basic period-summary)
- Holiday pay multipliers → Phase 2
- Buddhist calendar UI toggle → Phase 2

### Success criteria
- [ ] Run 1 month of TH payroll in parallel with Excel; total per worker matches within 0.01 THB.
- [ ] HR can close a period in < 1 hour (vs. ~1 day with Excel).
- [ ] Bank export accepted by 2 banks on first submission.
- [ ] All 12 reference test cases compute correctly.

### Tech stack (proposed)
- Frontend: Next.js + Tailwind + shadcn/ui (TH/EN i18n)
- Backend: Supabase (Postgres + Auth + Storage)
- Excel parsing: SheetJS or `openpyxl` via Python edge function
- Hosting: Vercel + Supabase managed

### Phase 1 testing focus
**Crucial — given the source Excel has no cached values, MVP testing must include**:
1. Reproduce all 12 reference test cases byte-for-byte against team-validated actual amounts.
2. Round-trip: import a `วันที่ X.xlsx`, export the resulting payroll, compare.
3. Edge cases: night shift, missing checkout, sick leave, damage > daily rate.
4. Concurrency: two HR users editing same period simultaneously.
5. PDPA: verify bank account is masked for non-HR roles.

---

## Phase 1.1 — Hardening & remaining banks

**Duration**: 2–3 weeks (overlaps with Phase 1 parallel run)

**Scope**:
- Add bank format adapters for the remaining 8 banks (BBL, KTB, BAY, GSB, TTB, KKP, BAAC, UOB).
- Performance tuning (handle a year of data without slowdown).
- Fix bugs from Phase 1 parallel run.
- "View payslip" UI for individual worker.

---

## Phase 2 — Allowances, holidays, mobile (TH)

**Duration**: 4–5 weeks

### In-scope
| Capability | Notes |
|---|---|
| Compensation components system | Per `compensation.md` schema |
| Meal allowance, transport allowance, night premium | Default amounts configurable |
| Holiday calendar | TH public holidays seeded; pay multipliers |
| Half-day leave / sick leave policy | Configurable per Q-12, Q-13 |
| Buddhist calendar UI toggle | |
| Mobile checkin (if Boxme WMS API ready) | Webhook from app/WMS |
| Itemized payslip | Each component shown |
| Payroll dashboard (KPI cards, weekly trend) | |

### Exit criteria
- HR can add a new allowance type without engineering.
- Workers' payslip shows itemized breakdown.

---

## Phase 3 — Vietnam expansion + worker grades + job types

**Duration**: 6 weeks

### In-scope
| Capability | Notes |
|---|---|
| VN country profile + VND currency | |
| VN holidays + legal limits | |
| VN bank file formats (Vietcombank, Techcombank, MB, BIDV, VPBank, ACB — confirm with VN team) | |
| Worker grades (NEW / SENIOR / LEAD) | Pay differs by grade |
| Job types (PICKING / PACKING / LOADING / INVENTORY) | Pay can differ by job |
| Multi-warehouse support | Workers can be transferred |
| Cross-country reporting (FX-aware) | Optional |
| What-if simulator | "If we raise BM3 to 550 THB, monthly cost = ?" |

### Exit criteria
- VN warehouse runs payroll on system.
- Grade-based rate differentials work.

---

## Phase 4 — Philippines expansion + tax engine

**Duration**: 8 weeks

### In-scope
- PH country profile + PHP + PH-specific shifts (regular vs special holidays)
- PH bank formats
- Tax withholding (TH PND-1, VN income tax, PH BIR Form 2316)
- Social security (TH SSO, VN BHXH, PH SSS+PhilHealth+Pag-IBIG)
- Bonus types: 13th-month pay (TH/VN/PH all have this concept), service incentive leave (PH)

---

## Phase 5+ — Advanced (backlog)

- Worker self-service mobile app (view payslip, request leave)
- Attendance from biometric devices (face ID / fingerprint)
- Anomaly detection (worker X is suddenly always 5 min late)
- Forecasting (predicted payroll cost given upcoming shipments)
- API for external HRIS integration

---

## Risk register

| Risk | Mitigation |
|---|---|
| Existing Excel formulas turn out to differ from what team actually pays | Run parallel for 1 month; reconcile daily |
| Bank file formats more exotic than expected | Start with 2 banks in MVP; rest in 1.1 |
| Thailand team doesn't respond to audit checklist on time | All defaults pre-filled; team can confirm/override async |
| WMS API documentation not available | Mobile checkin deferred to Phase 2 — manual entry UI is sufficient for MVP |
| Multi-tenant data crossover (VN data leaks into TH reports) | Strict country_code filter on every query; RLS enforces |
| Performance degradation as months accumulate | Materialized view `worker_hours_summary`; archive periods > 3 years to cold storage |

## Phase summary table

| Phase | Duration | Countries | Allowances | Grades | Bank exports | Mobile |
|---|---|---|---|---|---|---|
| 0 (Spec) | 2-3w | TH | — | — | — | — |
| 1 (MVP) | 4-6w | TH | base + OT | — | 2 banks | — |
| 1.1 | 2-3w | TH | base + OT | — | 10 banks | — |
| 2 | 4-5w | TH | + meal/transport/night/holiday | — | 10 banks | optional |
| 3 | 6w | TH + VN | full | ✅ | 10+6 banks | ✅ |
| 4 | 8w | TH + VN + PH | full + 13th month | ✅ | 10+6+5 banks | ✅ |

**Total to first business value: 6–9 weeks (Phase 0 + 1).**
**Total to all 3 countries fully featured: ~7 months.**
