-- 005: Payroll — daily computed rows, periods, period lines

CREATE TABLE IF NOT EXISTS payroll_daily (
  id                     TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  attendance_id          TEXT NOT NULL UNIQUE REFERENCES attendance_records(id),
  country_code           TEXT NOT NULL REFERENCES countries(code),
  period_id              TEXT,  -- FK added after periods table exists
  -- computed fields (mirrors PayrollResult)
  dept_category          TEXT,
  shift_start            TEXT,
  shift_end              TEXT,
  crosses_midnight       INTEGER DEFAULT 0,
  shift_duration_hours   REAL DEFAULT 0,
  hours_bucket_u         REAL DEFAULT 8,
  wage_per_minute        REAL DEFAULT 0,
  late_minutes_raw       REAL DEFAULT 0,
  late_minutes_deducted  REAL DEFAULT 0,
  early_out_minutes      REAL DEFAULT 0,
  daily_rate_thb         REAL DEFAULT 0,
  late_deduction_thb     REAL DEFAULT 0,
  early_out_deduction_thb REAL DEFAULT 0,
  ot_total_hours         REAL DEFAULT 0,
  ot_pay_thb             REAL DEFAULT 0,
  damage_thb             REAL DEFAULT 0,
  other_deduction_thb    REAL DEFAULT 0,
  gross_wage_raw         REAL DEFAULT 0,
  gross_wage_thb         REAL DEFAULT 0,
  flags_json             TEXT DEFAULT '[]',  -- JSON array of Flag strings
  computed_at            TEXT NOT NULL DEFAULT (datetime('now')),
  engine_version         TEXT NOT NULL DEFAULT '2.0'
);

CREATE INDEX IF NOT EXISTS idx_pd_country ON payroll_daily(country_code);
CREATE INDEX IF NOT EXISTS idx_pd_period ON payroll_daily(period_id);

-- Breakdown by component (for audit trail of each pay component applied)
CREATE TABLE IF NOT EXISTS payroll_daily_components (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  payroll_daily_id TEXT NOT NULL REFERENCES payroll_daily(id),
  component_code  TEXT NOT NULL,
  amount_thb      REAL NOT NULL,
  applies_to      TEXT NOT NULL  -- 'gross' or 'deduction'
);

CREATE TABLE IF NOT EXISTS payroll_periods (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  warehouse_id TEXT REFERENCES warehouses(id),  -- NULL = all warehouses in country
  name         TEXT NOT NULL,                    -- 'April 2026'
  from_date    TEXT NOT NULL,
  to_date      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','locked','approved','exported')),
  locked_at    TEXT,
  locked_by    TEXT,
  approved_at  TEXT,
  approved_by  TEXT,
  created_by   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Add FK from payroll_daily to periods
-- (SQLite: add column, not full ALTER FOREIGN KEY — enforced at app layer)
CREATE INDEX IF NOT EXISTS idx_periods_country ON payroll_periods(country_code, status);

-- Aggregated per-worker summary for a period
CREATE TABLE IF NOT EXISTS payroll_period_lines (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  period_id        TEXT NOT NULL REFERENCES payroll_periods(id),
  worker_id        TEXT REFERENCES workers(id),
  full_name        TEXT NOT NULL,
  bank_code        TEXT,
  bank_account     TEXT,
  shifts           INTEGER DEFAULT 0,
  total_gross_thb  REAL DEFAULT 0,
  total_ot_thb     REAL DEFAULT 0,
  total_late_thb   REAL DEFAULT 0,
  total_damage_thb REAL DEFAULT 0,
  net_pay_thb      REAL DEFAULT 0,
  computed_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(period_id, full_name)
);

CREATE INDEX IF NOT EXISTS idx_ppl_period ON payroll_period_lines(period_id);
