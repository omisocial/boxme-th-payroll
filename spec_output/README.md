# Boxme Seasonal Payroll — Specification Bundle (v0.2)

**Source**: `Thailand_Sessonal_Payment.xlsx`
**Author**: Boxme Vietnam BA team (Mark)
**Date**: 2026-04-30
**Status**: DRAFT v0.2 — phase = analysis & specification only (no implementation code)

## What's new in v0.2 (vs v0.1)

- **Multi-country**: TH, VN, PH support designed in from day 1 (TH active in MVP, others gated).
- **Configurable compensation**: components + rules engine — HR can add allowances (meal, transport, night premium) without engineering.
- **Worker grades + job types**: schema supports them; usage from Phase 3.
- **Legal work-time limits** per country.
- **Audit checklist Q's converted to defaults**: TH team only overrides what's wrong; doesn't have to fill blanks.
- **Phased roadmap**: explicit MVP scope (TH only, Excel import + daily calc) before allowances and other countries.

## What's in this folder

```
spec_output/
├── README.md                              ← you are here
├── analysis/                              ← reverse-engineering of the Excel (unchanged from v0.1)
│   ├── 01_analysis_report.md              bilingual TH/EN logic + findings
│   ├── 02_audit_checklist.md              38 numbered questions for Thailand team
│   ├── 03_test_cases.md                   12 worked validation cases
│   ├── 04_glossary.md                     TH / EN / VI terminology
│   ├── test_cases.csv                     machine-readable test set
│   ├── members_anon.csv                   anonymized Members master
│   ├── timesheets_anon.csv                anonymized long-format timesheets
│   └── damage_anon.csv                    anonymized damage log
└── openspec/
    ├── README.md
    ├── capabilities/seasonal-payroll/
    │   ├── spec.md                        capability scope (multi-country, phased)
    │   ├── phased-roadmap.md          ★   Phase 1 MVP → Phase 4 expansion
    │   ├── default-configs.md         ★   38 audit Q's → 38 default configs
    │   ├── multi-country.md           ★   country / warehouse / holiday
    │   ├── compensation.md            ★   configurable pay components + rules
    │   ├── work-limits.md             ★   legal max-hour rules per country
    │   ├── data-model-v2.md           ★   current schema
    │   ├── data-model.md                  v0.1 — superseded, kept for reference
    │   ├── formulas.md                    payroll math
    │   ├── api.md                         endpoint surface
    │   ├── use-cases.md                   user flows
    │   └── edge-cases.md                  edge case catalogue
    └── changes/                       ← (empty — no change proposals yet)
```

★ = new in v0.2.

## How to use

### For Thailand operations team
1. Read `analysis/01_analysis_report.md` — it explains what we found in the Excel.
2. Open `analysis/02_audit_checklist.md` — 38 questions. **You don't have to answer all** — defaults are pre-filled in `openspec/.../default-configs.md`. Just confirm or override.
3. Validate `analysis/03_test_cases.md` — give us the actual paid amount for each of the 12 cases so we can confirm the formula.

### For Boxme VN BA / PM
1. `openspec/capabilities/seasonal-payroll/spec.md` for scope.
2. `phased-roadmap.md` for the timeline.
3. `default-configs.md` for the assumption set.

### For engineering
1. Skim `spec.md`.
2. Deep-dive `data-model-v2.md` + `compensation.md` + `formulas.md`.
3. Implement Phase 1 only (TH, base+OT, Excel import, daily calc, 2 banks).
4. Defer everything marked Phase 2+.

## Privacy

All deliverables reference workers by `worker_id` (8-char salted SHA-256 hash). Real PII (full names, phone numbers, bank accounts) is in `private/worker_id_map.csv`, kept out of this bundle.

## Top open questions (priority)

The 38 questions in `analysis/02_audit_checklist.md` are now mapped to **default configs** in `default-configs.md`. Team can override via the admin UI's "Defaults Confirmation" page after MVP go-live, or via the spec sign-off process now. Highest-priority confirmations:

1. **Q-1 / Q-2**: Daily rate is THB 500 flat for everyone — confirm or specify per-department amounts.
2. **Q-12 / Q-13 / Q-14**: Sick / personal / half-day leave handling — defaults follow current Excel behavior.
3. **Q-19**: Damage carryover & resigned-worker write-off policy.
4. **Q-25**: Canonical worker identifier (default: system-generated `worker_code`).
5. **Q-27**: Whether Boxme WMS exposes a check-in API (drives Phase 2 mobile scope).
6. **Q-28**: Sample bank export files — needed for MVP for K-BANK + SCB at minimum.

## MVP timeline at a glance

- **Now → +3 weeks**: Audit checklist responses + sample bank file → spec sign-off
- **+3 weeks → +9 weeks**: Build Phase 1 MVP (TH, Excel import, daily calc, 2 banks, defaults confirmation page)
- **+9 weeks → +12 weeks**: Parallel run with Excel for 1 month
- **+12 weeks**: TH go-live with Excel decommissioned
- **+4 months**: Phase 2 (allowances, holidays)
- **+6 months**: Phase 3 (VN expansion)
- **+9 months**: Phase 4 (PH expansion + tax)

## Contact

Boxme Vietnam BA — `mark@boxme.tech`
