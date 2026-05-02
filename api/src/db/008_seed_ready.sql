-- 008: Seed data — countries, warehouses, departments, shifts, users
-- Passwords are replaced by the gen-seed-passwords script before running.
-- Placeholders: $seed$sha256$db2002af6cb6fd9aadfa30c8648c02f49d6e5d379399083878d7c486317a312a, $seed$sha256$39f987b46004775738e7d4656d3d7434f318a833a3fedf61414476f8754123a4, etc.

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
  ('usr-admin',       'admin@boxme.tech',         '$seed$sha256$db2002af6cb6fd9aadfa30c8648c02f49d6e5d379399083878d7c486317a312a',       'super_admin',   '*',  1),
  ('usr-th-hr',       'th.hr@boxme.tech',          '$seed$sha256$39f987b46004775738e7d4656d3d7434f318a833a3fedf61414476f8754123a4',       'hr',            'TH', 1),
  ('usr-th-sup',      'th.supervisor@boxme.tech',  '$seed$sha256$fb698a22cb8e0f777407331f30c2b9f6c3d40071f2764b289ac00eb79ecdf97c',      'supervisor',    'TH', 1),
  ('usr-vn-hr',       'vn.hr@boxme.tech',          '$seed$sha256$5e7958c998f8e807abfe79a302f0fbb6b8eceb368155a34d0c55820f7d05322d',       'hr',            'VN', 1),
  ('usr-ph-hr',       'ph.hr@boxme.tech',          '$seed$sha256$3370e3423ebec57add40948cc3cf6b4548f03af29fa33b643aaa1ab59b809031',       'hr',            'PH', 1),
  ('usr-viewer',      'viewer@boxme.tech',          '$seed$sha256$7a78a817b8bc0fc0815cdc703b76425c6997b2ba25959e4ef9253aa82118215e',      'viewer',        '*',  1);

-- Force-update password hashes (idempotent)
UPDATE users SET password_hash='$seed$sha256$db2002af6cb6fd9aadfa30c8648c02f49d6e5d379399083878d7c486317a312a', force_password_change=1 WHERE email='admin@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$39f987b46004775738e7d4656d3d7434f318a833a3fedf61414476f8754123a4', force_password_change=1 WHERE email='th.hr@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$fb698a22cb8e0f777407331f30c2b9f6c3d40071f2764b289ac00eb79ecdf97c', force_password_change=1 WHERE email='th.supervisor@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$5e7958c998f8e807abfe79a302f0fbb6b8eceb368155a34d0c55820f7d05322d', force_password_change=1 WHERE email='vn.hr@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$3370e3423ebec57add40948cc3cf6b4548f03af29fa33b643aaa1ab59b809031', force_password_change=1 WHERE email='ph.hr@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$7a78a817b8bc0fc0815cdc703b76425c6997b2ba25959e4ef9253aa82118215e', force_password_change=1 WHERE email='viewer@boxme.tech';
