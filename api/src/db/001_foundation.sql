-- 001: Foundation — countries, warehouses, departments, shifts

CREATE TABLE IF NOT EXISTS countries (
  code       TEXT PRIMARY KEY,             -- 'TH', 'VN', 'PH'
  name       TEXT NOT NULL,
  currency   TEXT NOT NULL,                -- 'THB', 'VND', 'PHP'
  timezone   TEXT NOT NULL,               -- 'Asia/Bangkok'
  locale     TEXT NOT NULL DEFAULT 'en',  -- default UI locale
  active     INTEGER NOT NULL DEFAULT 0,  -- 1 = enabled
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS warehouses (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,             -- 'TH-BKK-1'
  name         TEXT NOT NULL,
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS departments (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,             -- 'BM1', 'DW1'
  name_local   TEXT NOT NULL,
  name_en      TEXT,
  active       INTEGER NOT NULL DEFAULT 1,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS shifts (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,             -- 'MORNING', 'NIGHT'
  name         TEXT NOT NULL,
  time_range   TEXT NOT NULL,             -- '08:30 - 17:30'
  is_overnight INTEGER NOT NULL DEFAULT 0,
  active       INTEGER NOT NULL DEFAULT 1,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS holidays (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  date         TEXT NOT NULL,             -- 'YYYY-MM-DD'
  name         TEXT NOT NULL,
  multiplier   REAL NOT NULL DEFAULT 2.0, -- OT rate on holiday
  UNIQUE(country_code, date)
);

CREATE TABLE IF NOT EXISTS legal_limits (
  id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code          TEXT NOT NULL REFERENCES countries(code) UNIQUE,
  max_daily_hours       REAL NOT NULL DEFAULT 8.0,
  max_weekly_hours      REAL NOT NULL DEFAULT 48.0,
  max_consecutive_days  INTEGER NOT NULL DEFAULT 6,
  ot_threshold_daily    REAL NOT NULL DEFAULT 8.0,
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
