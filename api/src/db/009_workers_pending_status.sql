-- 009: Allow workers.status = 'pending_update' and add created_via.
-- SQLite cannot ALTER a CHECK constraint in place — recreate the table.

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS workers_new (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code     TEXT NOT NULL REFERENCES countries(code),
  warehouse_id     TEXT NOT NULL REFERENCES warehouses(id),
  code             TEXT NOT NULL,
  name_local       TEXT NOT NULL,
  name_en          TEXT,
  department_code  TEXT,
  shift_code       TEXT,
  grade_id         TEXT REFERENCES worker_grades(id),
  job_type_code    TEXT NOT NULL DEFAULT 'GENERAL',
  status           TEXT NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active','resigned','suspended','pending_update','inactive')),
  created_via      TEXT NOT NULL DEFAULT 'manual'
                    CHECK(created_via IN ('manual','attendance_import','api')),
  bank_code        TEXT,
  bank_account     TEXT,
  phone            TEXT,
  start_date       TEXT,
  end_date         TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at       TEXT,
  UNIQUE(country_code, code)
);

INSERT INTO workers_new (
  id, country_code, warehouse_id, code, name_local, name_en,
  department_code, shift_code, grade_id, job_type_code, status,
  created_via, bank_code, bank_account, phone, start_date, end_date,
  notes, created_at, updated_at, deleted_at
)
SELECT
  id, country_code, warehouse_id, code, name_local, name_en,
  department_code, shift_code, grade_id, job_type_code, status,
  'manual', bank_code, bank_account, phone, start_date, end_date,
  notes, created_at, updated_at, deleted_at
FROM workers;

DROP TABLE workers;
ALTER TABLE workers_new RENAME TO workers;

CREATE INDEX IF NOT EXISTS idx_workers_country ON workers(country_code);
CREATE INDEX IF NOT EXISTS idx_workers_warehouse ON workers(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_workers_pending ON workers(status) WHERE status = 'pending_update';

PRAGMA foreign_keys = ON;
