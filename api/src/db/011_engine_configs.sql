-- 011: Payroll engine configs — per-country, optionally per-warehouse override.
-- Stores all values previously hardcoded in webapp/src/payroll/engine.ts:
--   default daily rate, OT multiplier, late buffer/rounding, plus
--   keyword arrays for dept classification & note-flag detection.

CREATE TABLE IF NOT EXISTS payroll_engine_configs (
  id                       TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code             TEXT NOT NULL REFERENCES countries(code),
  warehouse_id             TEXT REFERENCES warehouses(id),  -- NULL = country default
  effective_from           TEXT NOT NULL DEFAULT (date('now')),
  default_daily_rate       REAL NOT NULL DEFAULT 500,
  ot_multiplier            REAL NOT NULL DEFAULT 1.5,
  late_buffer_minutes      INTEGER NOT NULL DEFAULT 0,
  late_rounding_unit       INTEGER NOT NULL DEFAULT 0,
  paid_leave_keywords      TEXT NOT NULL DEFAULT '[]',  -- JSON array
  bm_prefixes              TEXT NOT NULL DEFAULT '["bm"]',
  dw_prefixes              TEXT NOT NULL DEFAULT '["dw"]',
  intern_keywords          TEXT NOT NULL DEFAULT '[]',
  housekeeper_keywords     TEXT NOT NULL DEFAULT '[]',
  sick_leave_keywords      TEXT NOT NULL DEFAULT '[]',
  personal_leave_keywords  TEXT NOT NULL DEFAULT '[]',
  manual_checkin_keywords  TEXT NOT NULL DEFAULT '[]',
  formula_overrides        TEXT NOT NULL DEFAULT '{}',  -- JSON object for future
  created_at               TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at               TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(country_code, warehouse_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_engine_configs_country ON payroll_engine_configs(country_code);
CREATE INDEX IF NOT EXISTS idx_engine_configs_warehouse ON payroll_engine_configs(warehouse_id);

-- Seed the current TH defaults that match webapp/src/payroll/types.ts DEFAULT_ENGINE_CONFIG.
INSERT OR IGNORE INTO payroll_engine_configs (
  id, country_code, warehouse_id, effective_from,
  default_daily_rate, ot_multiplier, late_buffer_minutes, late_rounding_unit,
  paid_leave_keywords, bm_prefixes, dw_prefixes,
  intern_keywords, housekeeper_keywords,
  sick_leave_keywords, personal_leave_keywords, manual_checkin_keywords
) VALUES (
  'cfg-th-default', 'TH', NULL, '2024-01-01',
  500, 1.5, 0, 0,
  '[]',
  '["bm"]', '["dw"]',
  '["นักศึกษา","นศ."]',
  '["แม่บ้าน","แมบ้าน"]',
  '["ลาป่วย","ลาไปหาหมอ","หาหมอ"]',
  '["ลากิจ","ลาบ่าย","ลางานช่วงบ่าย","แจ้งลา","ลากลับ"]',
  '["โทรศัพท์เข้าแอป","ไม่ได้เช็คอิน","แอปไม่ได้"]'
);
