-- 002: Workers, grades, job types

CREATE TABLE IF NOT EXISTS worker_grades (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,   -- 'NEW', 'EXPERIENCED', 'SENIOR'
  name         TEXT NOT NULL,
  active       INTEGER NOT NULL DEFAULT 1,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS job_types (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,   -- 'GENERAL', 'FORKLIFT', 'SUPERVISOR'
  name         TEXT NOT NULL,
  active       INTEGER NOT NULL DEFAULT 1,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS workers (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code     TEXT NOT NULL REFERENCES countries(code),
  warehouse_id     TEXT NOT NULL REFERENCES warehouses(id),
  code             TEXT NOT NULL,              -- internal worker code
  name_local       TEXT NOT NULL,
  name_en          TEXT,
  department_code  TEXT,
  shift_code       TEXT,
  grade_id         TEXT REFERENCES worker_grades(id),
  job_type_code    TEXT NOT NULL DEFAULT 'GENERAL',
  status           TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','resigned','suspended')),
  bank_code        TEXT,
  bank_account     TEXT,                       -- stored encrypted or masked for non-HR
  phone            TEXT,
  start_date       TEXT,
  end_date         TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at       TEXT,
  UNIQUE(country_code, code)
);

CREATE INDEX IF NOT EXISTS idx_workers_country ON workers(country_code);
CREATE INDEX IF NOT EXISTS idx_workers_warehouse ON workers(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
