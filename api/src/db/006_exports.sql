-- 006: Bank exports

CREATE TABLE IF NOT EXISTS bank_exports (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  period_id    TEXT NOT NULL REFERENCES payroll_periods(id),
  bank_code    TEXT NOT NULL,
  filename     TEXT NOT NULL,
  r2_key       TEXT NOT NULL,      -- R2 object key for download
  row_count    INTEGER NOT NULL DEFAULT 0,
  total_thb    REAL NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('generating','ready','error')),
  error_msg    TEXT,
  created_by   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exports_period ON bank_exports(period_id);
