-- 003: Compensation — configurable pay components, rules, rate configs

CREATE TABLE IF NOT EXISTS rate_configs (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code   TEXT NOT NULL REFERENCES countries(code),
  department_code TEXT,                        -- NULL = applies to all depts
  grade_code     TEXT,                         -- NULL = applies to all grades
  base_daily     REAL NOT NULL,                -- e.g. 500 THB
  ot_multiplier  REAL NOT NULL DEFAULT 1.5,
  effective_from TEXT NOT NULL,                -- 'YYYY-MM-DD' — versioned
  created_by     TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rate_configs_country_date ON rate_configs(country_code, effective_from);

-- Configurable pay components (meal, transport, night premium, etc.)
CREATE TABLE IF NOT EXISTS pay_components (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code  TEXT NOT NULL REFERENCES countries(code),
  code          TEXT NOT NULL,                 -- 'meal_allowance', 'night_premium'
  name          TEXT NOT NULL,
  formula_type  TEXT NOT NULL DEFAULT 'fixed' CHECK(formula_type IN ('fixed','per_hour','multiplier','expression')),
  formula_value TEXT NOT NULL DEFAULT '0',     -- number or safe expression
  applies_to    TEXT NOT NULL DEFAULT 'gross', -- 'gross' or 'deduction'
  active        INTEGER NOT NULL DEFAULT 1,
  effective_from TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(country_code, code, effective_from)
);

-- Rules that gate when a component applies
CREATE TABLE IF NOT EXISTS pay_rules (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  component_id     TEXT NOT NULL REFERENCES pay_components(id),
  condition_field  TEXT NOT NULL,              -- 'department_code','shift_code','job_type_code','day_type'
  condition_op     TEXT NOT NULL DEFAULT '=',  -- '=', 'IN', '!='
  condition_value  TEXT NOT NULL,              -- 'BM1' or '["BM1","BM3"]'
  priority         INTEGER NOT NULL DEFAULT 0  -- higher wins on conflict
);

CREATE INDEX IF NOT EXISTS idx_pay_rules_component ON pay_rules(component_id);

-- Bank export templates — JSON-driven column layout
CREATE TABLE IF NOT EXISTS bank_export_templates (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  country_code TEXT NOT NULL REFERENCES countries(code),
  bank_code    TEXT NOT NULL,    -- 'K-BANK', 'SCB', 'KTB'
  bank_name    TEXT NOT NULL,
  format       TEXT NOT NULL DEFAULT 'csv',  -- 'csv', 'txt', 'xlsx'
  encoding     TEXT NOT NULL DEFAULT 'utf-8',
  columns_json TEXT NOT NULL,   -- JSON array of {header, field, width, align}
  active       INTEGER NOT NULL DEFAULT 1,
  UNIQUE(country_code, bank_code)
);
