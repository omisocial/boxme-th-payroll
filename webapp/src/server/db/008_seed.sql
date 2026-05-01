-- 008: Seed data — countries, warehouses, departments, shifts, users
-- Passwords are replaced by the gen-seed-passwords script before running.
-- Placeholders: %%HASH_ADMIN%%, %%HASH_TH_HR%%, etc.

-- Countries
INSERT OR IGNORE INTO countries (code, name, currency, timezone, locale, active) VALUES
  ('TH', 'Thailand',     'THB', 'Asia/Bangkok',       'th', 1),
  ('VN', 'Vietnam',      'VND', 'Asia/Ho_Chi_Minh',   'vi', 0),
  ('PH', 'Philippines',  'PHP', 'Asia/Manila',         'en', 0);

-- Legal limits
INSERT OR IGNORE INTO legal_limits (country_code, max_daily_hours, max_weekly_hours, max_consecutive_days, ot_threshold_daily) VALUES
  ('TH', 8.0, 48.0, 6, 8.0),
  ('VN', 8.0, 48.0, 6, 8.0),
  ('PH', 8.0, 48.0, 6, 8.0);

-- TH Warehouses
INSERT OR IGNORE INTO warehouses (id, country_code, code, name) VALUES
  ('wh-th-bkk-1', 'TH', 'TH-BKK-1', 'Bangkhen Warehouse 1'),
  ('wh-th-bkk-2', 'TH', 'TH-BKK-2', 'Bangkhen Warehouse 2');

-- TH Departments
INSERT OR IGNORE INTO departments (country_code, code, name_local, name_en) VALUES
  ('TH', 'BM1',       'BM1',              'BM Zone 1'),
  ('TH', 'BM3',       'BM3',              'BM Zone 3'),
  ('TH', 'DW1',       'DW1',              'DW Zone 1'),
  ('TH', 'DW3',       'DW3',              'DW Zone 3'),
  ('TH', 'HOUSEKEEP', 'แม่บ้าน',           'Housekeeping'),
  ('TH', 'INTERN',    'นักศึกษาฝึกงาน',   'Intern');

-- TH Shifts
INSERT OR IGNORE INTO shifts (country_code, code, name, time_range, is_overnight) VALUES
  ('TH', 'MORNING',   'Morning',   '08:30 - 17:30', 0),
  ('TH', 'AFTERNOON', 'Afternoon', '13:00 - 22:00', 0),
  ('TH', 'NIGHT_A',   'Night A',   '22:00 - 07:00', 1),
  ('TH', 'NIGHT_B',   'Night B',   '20:00 - 05:00', 1);

-- TH Worker grades (Phase 3 usage, seeded now)
INSERT OR IGNORE INTO worker_grades (country_code, code, name) VALUES
  ('TH', 'GENERAL', 'General');

-- TH Job types
INSERT OR IGNORE INTO job_types (country_code, code, name) VALUES
  ('TH', 'GENERAL', 'General Worker');

-- TH Base rate config (500 THB/day, effective from 2026-01-01)
INSERT OR IGNORE INTO rate_configs (country_code, department_code, base_daily, ot_multiplier, effective_from) VALUES
  ('TH', NULL, 500.0, 1.5, '2026-01-01');

-- TH Pay components — Phase 1 core set
INSERT OR IGNORE INTO pay_components (country_code, code, name, formula_type, formula_value, applies_to, effective_from) VALUES
  ('TH', 'base_wage',          'Base Wage',           'fixed',  '0',   'gross',     '2026-01-01'),
  ('TH', 'ot_pay',             'OT Pay',              'fixed',  '0',   'gross',     '2026-01-01'),
  ('TH', 'late_deduction',     'Late Deduction',      'fixed',  '0',   'deduction', '2026-01-01'),
  ('TH', 'early_out_deduction','Early Out Deduction',  'fixed',  '0',   'deduction', '2026-01-01'),
  ('TH', 'damage_deduction',   'Damage Deduction',    'fixed',  '0',   'deduction', '2026-01-01');

-- K-BANK export template
INSERT OR IGNORE INTO bank_export_templates (country_code, bank_code, bank_name, format, encoding, columns_json) VALUES
  ('TH', 'K-BANK', 'Kasikorn Bank', 'csv', 'utf-8', '[
    {"header":"เลขที่บัญชี","field":"bank_account","width":15},
    {"header":"ชื่อ","field":"full_name","width":50},
    {"header":"จำนวนเงิน","field":"net_pay_thb","width":12,"align":"right"},
    {"header":"สาขา","field":"branch","width":10},
    {"header":"หมายเหตุ","field":"period_name","width":30}
  ]');

-- SCB export template
INSERT OR IGNORE INTO bank_export_templates (country_code, bank_code, bank_name, format, encoding, columns_json) VALUES
  ('TH', 'SCB', 'Siam Commercial Bank', 'csv', 'utf-8', '[
    {"header":"Account No","field":"bank_account","width":15},
    {"header":"Name","field":"full_name","width":50},
    {"header":"Amount","field":"net_pay_thb","width":12,"align":"right"},
    {"header":"Ref","field":"period_name","width":30}
  ]');

-- Default users (passwords injected by gen-seed-passwords.ts)
INSERT OR IGNORE INTO users (id, email, password_hash, role, country_scope, force_password_change) VALUES
  ('usr-admin',       'admin@boxme.tech',         '%%HASH_ADMIN%%',       'super_admin',   '*',  1),
  ('usr-th-hr',       'th.hr@boxme.tech',          '%%HASH_TH_HR%%',       'hr',            'TH', 1),
  ('usr-th-sup',      'th.supervisor@boxme.tech',  '%%HASH_TH_SUP%%',      'supervisor',    'TH', 1),
  ('usr-vn-hr',       'vn.hr@boxme.tech',          '%%HASH_VN_HR%%',       'hr',            'VN', 1),
  ('usr-ph-hr',       'ph.hr@boxme.tech',          '%%HASH_PH_HR%%',       'hr',            'PH', 1),
  ('usr-viewer',      'viewer@boxme.tech',          '%%HASH_VIEWER%%',      'viewer',        '*',  1);
