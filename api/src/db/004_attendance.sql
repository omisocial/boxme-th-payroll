-- 004: Attendance records, damages, damage schedule

CREATE TABLE IF NOT EXISTS attendance_records (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code     TEXT NOT NULL REFERENCES countries(code),
  warehouse_id     TEXT NOT NULL REFERENCES warehouses(id),
  worker_id        TEXT REFERENCES workers(id),  -- NULL if unmatched import row
  work_date        TEXT NOT NULL,                -- 'YYYY-MM-DD'
  full_name        TEXT NOT NULL,
  nickname         TEXT,
  checkin          TEXT,
  checkout         TEXT,
  note             TEXT,
  shift_code       TEXT,
  job_type_code    TEXT NOT NULL DEFAULT 'GENERAL',
  manual_note      TEXT,
  ot_before_hours  REAL DEFAULT 0,
  ot_after_hours   REAL DEFAULT 0,
  damage_deduction REAL DEFAULT 0,
  other_deduction  REAL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','disputed','deleted')),
  import_batch_id  TEXT,                         -- groups rows from one Excel import
  created_by       TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at       TEXT
);

CREATE INDEX IF NOT EXISTS idx_att_country_date ON attendance_records(country_code, work_date);
CREATE INDEX IF NOT EXISTS idx_att_worker ON attendance_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_att_batch ON attendance_records(import_batch_id);

-- Damage deduction log
CREATE TABLE IF NOT EXISTS damages (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  worker_id    TEXT REFERENCES workers(id),
  full_name    TEXT NOT NULL,
  amount_thb   REAL NOT NULL,
  incident_date TEXT,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','cleared','written_off')),
  created_by   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Scheduled deduction events for a damage
CREATE TABLE IF NOT EXISTS damage_schedule (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  damage_id        TEXT NOT NULL REFERENCES damages(id),
  deduction_date   TEXT NOT NULL,  -- 'YYYY-MM-DD' — which day to deduct
  amount_thb       REAL NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','applied','cancelled')),
  applied_at       TEXT,
  attendance_id    TEXT REFERENCES attendance_records(id)
);

CREATE INDEX IF NOT EXISTS idx_dmg_sched_date ON damage_schedule(deduction_date, status);

-- Import session cache — stores preview rows in KV, tracked here for audit
CREATE TABLE IF NOT EXISTS import_sessions (
  id           TEXT PRIMARY KEY,              -- random UUID stored in KV
  country_code TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  filename     TEXT NOT NULL,
  row_count    INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'preview' CHECK(status IN ('preview','committed','expired')),
  created_by   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  committed_at TEXT
);
