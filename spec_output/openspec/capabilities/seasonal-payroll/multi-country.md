# Multi-Country Configuration / Cấu hình đa quốc gia

> **Goal**: System designed for VN / TH / PH with configurability so a 4th country can be added without code changes.
> **MVP scope**: TH only — but data model and config keys must accommodate the others from day 1.

## 1. Country profile

```sql
countries
├─ code               TEXT PK    -- 'VN', 'TH', 'PH'
├─ name_en            TEXT
├─ name_local         TEXT       -- 'ประเทศไทย', 'Việt Nam', 'Pilipinas'
├─ currency_code      TEXT       -- 'THB', 'VND', 'PHP'
├─ timezone           TEXT       -- 'Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Manila'
├─ default_locale     TEXT       -- 'th-TH', 'vi-VN', 'en-PH'
├─ calendar_modes     TEXT[]     -- ['gregorian', 'buddhist'] for TH; ['gregorian'] elsewhere
├─ week_starts_on     TEXT       -- 'mon' (default ISO)
├─ payroll_period_default TEXT   -- 'monthly' for TH/VN/PH; 'biweekly' for some PH employers
└─ active             BOOLEAN
```

Pre-seeded rows (MVP ships with TH only enabled, others rows exist with `active = false`):

| code | name_en | currency | timezone | calendar_modes | active in MVP |
|---|---|---|---|---|---|
| TH | Thailand | THB | Asia/Bangkok | gregorian, buddhist | ✅ |
| VN | Vietnam | VND | Asia/Ho_Chi_Minh | gregorian | ❌ (Phase 3) |
| PH | Philippines | PHP | Asia/Manila | gregorian | ❌ (Phase 4) |

## 2. Warehouses

```sql
warehouses
├─ id                 UUID PK
├─ code               TEXT UNIQUE   -- 'TH-BKK-1', 'TH-BKK-2', 'VN-HCM-1'
├─ name_local         TEXT
├─ country_code       TEXT FK
├─ address_local      TEXT
├─ active             BOOLEAN
├─ created_at, updated_at
```

A worker is **assigned** to a warehouse via `workers.warehouse_id`. Daily sheets and rate configs can be scoped per warehouse (one warehouse can pay differently from another in the same country).

The current Excel `คลังที่ 1` / `คลังที่ 2` (`สินค้าเสียหาย` sheet) maps to two warehouse rows in TH.

## 3. Holiday calendar

```sql
holidays
├─ id                 UUID PK
├─ country_code       TEXT FK
├─ holiday_date       DATE
├─ name_local         TEXT          -- 'วันสงกรานต์', 'Tết Nguyên Đán'
├─ name_en            TEXT
├─ holiday_type       TEXT CHECK ∈ ('public', 'company', 'optional')
├─ ot_multiplier_override NUMERIC(4,2)   -- e.g. 3.0 for Thai public holiday OT
├─ pay_multiplier     NUMERIC(4,2)       -- e.g. 2.0 → working on holiday earns 2× regular
├─ active             BOOLEAN
```

Per Thai labor law: working on a paid public holiday → 2× regular pay; OT on a public holiday → 3× hourly. The `holidays` table holds these multipliers so payroll math reads them, not hard-codes.

VN has different rules (300% of normal day rate on public holidays). PH has a regular vs special holiday distinction.

## 4. Legal work-time limits

See `work-limits.md`. The `legal_limits` table is country-scoped, evaluated as **warnings** during period close.

## 5. UI / locale configuration

```sql
ui_translations
├─ key                 TEXT       -- 'attendance.late_minutes'
├─ locale              TEXT       -- 'th-TH', 'vi-VN', 'en-US'
├─ value               TEXT
├─ PRIMARY KEY (key, locale)
```

For MVP, only `th-TH` and `en-US` translations ship. Vietnamese / Filipino added in later phases.

UI date formatting:
- TH: user can toggle Buddhist (พ.ศ.) ↔ Gregorian (ค.ศ.); internal storage always Gregorian ISO.
- VN: dd/MM/yyyy.
- PH: MM/dd/yyyy.

## 6. Currency display

- Internal storage: amounts are stored with their `currency_code` alongside. Different countries cannot mix in one period_export.
- Bank exports always use the country-specific currency.
- Reporting can convert across using `fx_rates` table (out of MVP scope; Phase 3+).

## 7. Country-specific extension points

Each of the following must be **plugged in per country**, not hard-coded:

| Extension point | TH default | VN default | PH default |
|---|---|---|---|
| `late_buffer_minutes` | 0 | 5 | 5 |
| `ot_multiplier_weekday` | 1.5 | 1.5 | 1.25 |
| `ot_multiplier_holiday` | 3.0 | 3.0 | 2.6 |
| `min_age_for_employment` | 15 | 15 | 15 |
| `max_hours_per_day` | 8 | 8 | 8 |
| `max_ot_hours_per_week` | 36 | — | — |
| `max_ot_hours_per_year` | — | 200 (300 special) | — |
| `bank_file_formats` | 10 banks | 6 banks (TBD) | 5 banks (TBD) |
| `tax_engine` | (out of MVP) | (out of MVP) | (out of MVP) |
| `work_permit_required` | true (foreigners) | true | false |

## 8. Migration / on-boarding a new country

```
1. INSERT INTO countries (...) VALUES ('XX', ...)
2. INSERT INTO warehouses for each site
3. INSERT INTO legal_limits with country_code = 'XX'
4. INSERT INTO holidays for the year
5. INSERT INTO compensation_components & compensation_rules (see compensation.md)
6. INSERT INTO bank_format_adapters per bank
7. UPDATE countries.active = true
```

No code changes required; the system is data-driven.

## 9. References to existing analysis

- TH warehouses 1 and 2 → `warehouses` rows `TH-BKK-1`, `TH-BKK-2` (placeholder until team confirms physical sites — Q-20).
- TH calendar should default to `buddhist` display per regional team preference (configurable per user).
