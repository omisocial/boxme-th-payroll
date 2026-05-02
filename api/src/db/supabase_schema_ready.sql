-- ============================================================
-- Boxme Seasonal Payroll — Supabase PostgreSQL Schema
-- Run in Supabase SQL Editor (once, top to bottom)
-- ============================================================

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Foundation ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS countries (
  code       TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  currency   TEXT NOT NULL,
  timezone   TEXT NOT NULL,
  locale     TEXT NOT NULL DEFAULT 'en',
  active     BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS departments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,
  name_local   TEXT NOT NULL,
  name_en      TEXT,
  active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS shifts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  time_range   TEXT NOT NULL,
  is_overnight BOOLEAN NOT NULL DEFAULT false,
  active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS holidays (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  date         DATE NOT NULL,
  name         TEXT NOT NULL,
  multiplier   NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  UNIQUE(country_code, date)
);

CREATE TABLE IF NOT EXISTS legal_limits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code          TEXT NOT NULL REFERENCES countries(code) UNIQUE,
  max_daily_hours       NUMERIC(4,2) NOT NULL DEFAULT 8.0,
  max_weekly_hours      NUMERIC(5,2) NOT NULL DEFAULT 48.0,
  max_consecutive_days  INTEGER NOT NULL DEFAULT 6,
  ot_threshold_daily    NUMERIC(4,2) NOT NULL DEFAULT 8.0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Workers ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS worker_grades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS job_types (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(country_code, code)
);

CREATE TABLE IF NOT EXISTS workers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code     TEXT NOT NULL REFERENCES countries(code),
  warehouse_id     UUID NOT NULL REFERENCES warehouses(id),
  code             TEXT NOT NULL,
  name_local       TEXT NOT NULL,
  name_en          TEXT,
  department_code  TEXT,
  shift_code       TEXT,
  grade_id         UUID REFERENCES worker_grades(id),
  job_type_code    TEXT NOT NULL DEFAULT 'GENERAL',
  status           TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','resigned','suspended')),
  bank_code        TEXT,
  bank_account     TEXT,
  phone            TEXT,
  start_date       DATE,
  end_date         DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE(country_code, code)
);

CREATE INDEX IF NOT EXISTS idx_workers_country ON workers(country_code);
CREATE INDEX IF NOT EXISTS idx_workers_warehouse ON workers(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- ─── Compensation ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rate_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    TEXT NOT NULL REFERENCES countries(code),
  department_code TEXT,
  grade_code      TEXT,
  base_daily      NUMERIC(10,2) NOT NULL,
  ot_multiplier   NUMERIC(4,2) NOT NULL DEFAULT 1.5,
  effective_from  DATE NOT NULL,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_configs_country_date ON rate_configs(country_code, effective_from);

CREATE TABLE IF NOT EXISTS pay_components (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code   TEXT NOT NULL REFERENCES countries(code),
  code           TEXT NOT NULL,
  name           TEXT NOT NULL,
  formula_type   TEXT NOT NULL DEFAULT 'fixed' CHECK(formula_type IN ('fixed','per_hour','multiplier','expression')),
  formula_value  TEXT NOT NULL DEFAULT '0',
  applies_to     TEXT NOT NULL DEFAULT 'gross' CHECK(applies_to IN ('gross','deduction')),
  active         BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(country_code, code, effective_from)
);

CREATE TABLE IF NOT EXISTS pay_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id    UUID NOT NULL REFERENCES pay_components(id),
  condition_field TEXT NOT NULL,
  condition_op    TEXT NOT NULL DEFAULT '=',
  condition_value TEXT NOT NULL,
  priority        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bank_export_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  bank_code    TEXT NOT NULL,
  bank_name    TEXT NOT NULL,
  format       TEXT NOT NULL DEFAULT 'csv',
  encoding     TEXT NOT NULL DEFAULT 'utf-8',
  columns_json JSONB NOT NULL DEFAULT '[]',
  active       BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(country_code, bank_code)
);

-- ─── Attendance ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS attendance_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code     TEXT NOT NULL REFERENCES countries(code),
  warehouse_id     UUID NOT NULL REFERENCES warehouses(id),
  worker_id        UUID REFERENCES workers(id),
  work_date        DATE NOT NULL,
  full_name        TEXT NOT NULL,
  nickname         TEXT,
  checkin          TEXT,
  checkout         TEXT,
  note             TEXT,
  shift_code       TEXT,
  job_type_code    TEXT NOT NULL DEFAULT 'GENERAL',
  manual_note      TEXT,
  ot_before_hours  NUMERIC(5,2) DEFAULT 0,
  ot_after_hours   NUMERIC(5,2) DEFAULT 0,
  damage_deduction NUMERIC(10,2) DEFAULT 0,
  other_deduction  NUMERIC(10,2) DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','disputed','deleted')),
  import_batch_id  TEXT,
  created_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_att_country_date ON attendance_records(country_code, work_date);
CREATE INDEX IF NOT EXISTS idx_att_worker ON attendance_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_att_batch ON attendance_records(import_batch_id);

CREATE TABLE IF NOT EXISTS damages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code  TEXT NOT NULL REFERENCES countries(code),
  worker_id     UUID REFERENCES workers(id),
  full_name     TEXT NOT NULL,
  amount_thb    NUMERIC(10,2) NOT NULL,
  incident_date DATE,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','cleared','written_off')),
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS damage_schedule (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  damage_id      UUID NOT NULL REFERENCES damages(id),
  deduction_date DATE NOT NULL,
  amount_thb     NUMERIC(10,2) NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','applied','cancelled')),
  applied_at     TIMESTAMPTZ,
  attendance_id  UUID REFERENCES attendance_records(id)
);

CREATE TABLE IF NOT EXISTS import_sessions (
  id           TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  warehouse_id UUID NOT NULL,
  filename     TEXT NOT NULL,
  row_count    INTEGER NOT NULL DEFAULT 0,
  preview_json JSONB,
  status       TEXT NOT NULL DEFAULT 'preview' CHECK(status IN ('preview','committed','expired')),
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  committed_at TIMESTAMPTZ
);

-- ─── Payroll ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payroll_periods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES countries(code),
  warehouse_id UUID REFERENCES warehouses(id),
  name         TEXT NOT NULL,
  from_date    DATE NOT NULL,
  to_date      DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','locked','approved','exported')),
  locked_at    TIMESTAMPTZ,
  locked_by    TEXT,
  approved_at  TIMESTAMPTZ,
  approved_by  TEXT,
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_periods_country ON payroll_periods(country_code, status);

CREATE TABLE IF NOT EXISTS payroll_daily (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id           UUID NOT NULL UNIQUE REFERENCES attendance_records(id),
  country_code            TEXT NOT NULL REFERENCES countries(code),
  period_id               UUID REFERENCES payroll_periods(id),
  dept_category           TEXT,
  shift_start             TEXT,
  shift_end               TEXT,
  crosses_midnight        BOOLEAN DEFAULT false,
  shift_duration_hours    NUMERIC(5,2) DEFAULT 0,
  hours_bucket_u          NUMERIC(4,1) DEFAULT 8,
  wage_per_minute         NUMERIC(10,6) DEFAULT 0,
  late_minutes_raw        NUMERIC(6,2) DEFAULT 0,
  late_minutes_deducted   NUMERIC(6,2) DEFAULT 0,
  early_out_minutes       NUMERIC(6,2) DEFAULT 0,
  daily_rate_thb          NUMERIC(10,2) DEFAULT 0,
  late_deduction_thb      NUMERIC(10,2) DEFAULT 0,
  early_out_deduction_thb NUMERIC(10,2) DEFAULT 0,
  ot_total_hours          NUMERIC(5,2) DEFAULT 0,
  ot_pay_thb              NUMERIC(10,2) DEFAULT 0,
  damage_thb              NUMERIC(10,2) DEFAULT 0,
  other_deduction_thb     NUMERIC(10,2) DEFAULT 0,
  gross_wage_raw          NUMERIC(10,2) DEFAULT 0,
  gross_wage_thb          NUMERIC(10,2) DEFAULT 0,
  flags_json              JSONB DEFAULT '[]',
  computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_version          TEXT NOT NULL DEFAULT '2.0'
);

CREATE INDEX IF NOT EXISTS idx_pd_country ON payroll_daily(country_code);
CREATE INDEX IF NOT EXISTS idx_pd_period ON payroll_daily(period_id);

CREATE TABLE IF NOT EXISTS payroll_period_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id        UUID NOT NULL REFERENCES payroll_periods(id),
  worker_id        UUID REFERENCES workers(id),
  full_name        TEXT NOT NULL,
  bank_code        TEXT,
  bank_account     TEXT,
  shifts           INTEGER DEFAULT 0,
  total_gross_thb  NUMERIC(12,2) DEFAULT 0,
  total_ot_thb     NUMERIC(12,2) DEFAULT 0,
  total_late_thb   NUMERIC(12,2) DEFAULT 0,
  total_damage_thb NUMERIC(12,2) DEFAULT 0,
  net_pay_thb      NUMERIC(12,2) DEFAULT 0,
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(period_id, full_name)
);

CREATE INDEX IF NOT EXISTS idx_ppl_period ON payroll_period_lines(period_id);

-- ─── Exports ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bank_exports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id   UUID NOT NULL REFERENCES payroll_periods(id),
  bank_code   TEXT NOT NULL,
  filename    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  row_count   INTEGER NOT NULL DEFAULT 0,
  total_thb   NUMERIC(14,2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('generating','ready','error')),
  error_msg   TEXT,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_period ON bank_exports(period_id);

-- ─── Auth ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('super_admin','country_admin','hr','supervisor','viewer')),
  country_scope         TEXT NOT NULL DEFAULT '*',
  warehouse_id          UUID REFERENCES warehouses(id),
  force_password_change BOOLEAN NOT NULL DEFAULT true,
  active                BOOLEAN NOT NULL DEFAULT true,
  last_login_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS reset_tokens (
  token      TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID,
  user_email   TEXT,
  action       TEXT NOT NULL,
  entity       TEXT NOT NULL,
  entity_id    TEXT,
  country_code TEXT,
  before_json  JSONB,
  after_json   JSONB,
  ip           TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);

-- ─── Seed ──────────────────────────────────────────────────

INSERT INTO countries (code, name, currency, timezone, locale, active) VALUES
  ('TH', 'Thailand',    'THB', 'Asia/Bangkok',     'th', true),
  ('VN', 'Vietnam',     'VND', 'Asia/Ho_Chi_Minh', 'vi', false),
  ('PH', 'Philippines', 'PHP', 'Asia/Manila',      'en', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO legal_limits (country_code, max_daily_hours, max_weekly_hours, max_consecutive_days, ot_threshold_daily) VALUES
  ('TH', 8.0, 48.0, 6, 8.0),
  ('VN', 8.0, 48.0, 6, 8.0),
  ('PH', 8.0, 48.0, 6, 8.0)
ON CONFLICT (country_code) DO NOTHING;

INSERT INTO warehouses (id, country_code, code, name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'TH', 'TH-BKK-1', 'Bangkhen Warehouse 1'),
  ('a0000000-0000-0000-0000-000000000002', 'TH', 'TH-BKK-2', 'Bangkhen Warehouse 2')
ON CONFLICT (country_code, code) DO NOTHING;

INSERT INTO departments (country_code, code, name_local, name_en) VALUES
  ('TH', 'BM1',       'BM1',             'BM Zone 1'),
  ('TH', 'BM3',       'BM3',             'BM Zone 3'),
  ('TH', 'DW1',       'DW1',             'DW Zone 1'),
  ('TH', 'DW3',       'DW3',             'DW Zone 3'),
  ('TH', 'HOUSEKEEP', 'แม่บ้าน',          'Housekeeping'),
  ('TH', 'INTERN',    'นักศึกษาฝึกงาน',  'Intern')
ON CONFLICT (country_code, code) DO NOTHING;

INSERT INTO shifts (country_code, code, name, time_range, is_overnight) VALUES
  ('TH', 'MORNING',   'Morning',   '08:30 - 17:30', false),
  ('TH', 'AFTERNOON', 'Afternoon', '13:00 - 22:00', false),
  ('TH', 'NIGHT_A',   'Night A',   '22:00 - 07:00', true),
  ('TH', 'NIGHT_B',   'Night B',   '20:00 - 05:00', true)
ON CONFLICT (country_code, code) DO NOTHING;

INSERT INTO worker_grades (country_code, code, name) VALUES ('TH', 'GENERAL', 'General')
ON CONFLICT (country_code, code) DO NOTHING;

INSERT INTO job_types (country_code, code, name) VALUES ('TH', 'GENERAL', 'General Worker')
ON CONFLICT (country_code, code) DO NOTHING;

INSERT INTO rate_configs (country_code, department_code, base_daily, ot_multiplier, effective_from) VALUES
  ('TH', NULL, 500.00, 1.5, '2026-01-01')
ON CONFLICT DO NOTHING;

INSERT INTO pay_components (country_code, code, name, formula_type, formula_value, applies_to, effective_from) VALUES
  ('TH', 'base_wage',           'Base Wage',            'fixed', '0', 'gross',     '2026-01-01'),
  ('TH', 'ot_pay',              'OT Pay',               'fixed', '0', 'gross',     '2026-01-01'),
  ('TH', 'late_deduction',      'Late Deduction',        'fixed', '0', 'deduction', '2026-01-01'),
  ('TH', 'early_out_deduction', 'Early Out Deduction',   'fixed', '0', 'deduction', '2026-01-01'),
  ('TH', 'damage_deduction',    'Damage Deduction',      'fixed', '0', 'deduction', '2026-01-01')
ON CONFLICT (country_code, code, effective_from) DO NOTHING;

INSERT INTO bank_export_templates (country_code, bank_code, bank_name, format, encoding, columns_json) VALUES
  ('TH', 'K-BANK', 'Kasikorn Bank', 'csv', 'utf-8',
   '[{"header":"เลขที่บัญชี","field":"bank_account"},{"header":"ชื่อ","field":"full_name"},{"header":"จำนวนเงิน","field":"net_pay_thb"},{"header":"สาขา","field":"branch"},{"header":"หมายเหตุ","field":"period_name"}]'),
  ('TH', 'SCB', 'Siam Commercial Bank', 'csv', 'utf-8',
   '[{"header":"Account No","field":"bank_account"},{"header":"Name","field":"full_name"},{"header":"Amount","field":"net_pay_thb"},{"header":"Ref","field":"period_name"}]')
ON CONFLICT (country_code, bank_code) DO NOTHING;

-- Default users (passwords set by running: npm run db:seed:supabase)
-- Placeholder hashes replaced by gen-seed-passwords.ts
INSERT INTO users (id, email, password_hash, role, country_scope, force_password_change) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@boxme.tech',        '$seed$sha256$db2002af6cb6fd9aadfa30c8648c02f49d6e5d379399083878d7c486317a312a',  'super_admin', '*',  true),
  ('00000000-0000-0000-0000-000000000002', 'th.hr@boxme.tech',        '$seed$sha256$39f987b46004775738e7d4656d3d7434f318a833a3fedf61414476f8754123a4',  'hr',          'TH', true),
  ('00000000-0000-0000-0000-000000000003', 'th.supervisor@boxme.tech','$seed$sha256$fb698a22cb8e0f777407331f30c2b9f6c3d40071f2764b289ac00eb79ecdf97c', 'supervisor',  'TH', true),
  ('00000000-0000-0000-0000-000000000004', 'vn.hr@boxme.tech',        '$seed$sha256$5e7958c998f8e807abfe79a302f0fbb6b8eceb368155a34d0c55820f7d05322d',  'hr',          'VN', true),
  ('00000000-0000-0000-0000-000000000005', 'ph.hr@boxme.tech',        '$seed$sha256$3370e3423ebec57add40948cc3cf6b4548f03af29fa33b643aaa1ab59b809031',  'hr',          'PH', true),
  ('00000000-0000-0000-0000-000000000006', 'viewer@boxme.tech',       '$seed$sha256$7a78a817b8bc0fc0815cdc703b76425c6997b2ba25959e4ef9253aa82118215e', 'viewer',      '*',  true)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, force_password_change = true;

-- ─── Supabase Storage buckets (run manually or via dashboard) ──
-- CREATE policy "authenticated users" on storage.objects ...
-- Buckets to create: 'payroll-imports', 'payroll-exports'
