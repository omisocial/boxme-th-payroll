-- 008: Seed data — countries, warehouses, departments, shifts, users
-- Passwords are replaced by the gen-seed-passwords script before running.
-- Placeholders: $seed$sha256$8974a98859496cb0e9b40d17294d26e9ef766409743ac8e358524a8cbb8be0f1, $seed$sha256$fd5e70a90b9529463388c266b187b7300899b641153305e4d9a7230ea5f372c4, etc.

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
  ('usr-admin',    'admin@boxme.tech',           '$seed$sha256$8974a98859496cb0e9b40d17294d26e9ef766409743ac8e358524a8cbb8be0f1',    'super_admin',   '*',  1),
  ('usr-th-admin', 'th.admin@boxme.tech',        '$seed$sha256$cfa8aa5781d06cec51a405a06b1a3637a8887383b05350aa3200c43269ad307f', 'country_admin', 'TH', 1),
  ('usr-th-hr',    'th.hr@boxme.tech',           '$seed$sha256$fd5e70a90b9529463388c266b187b7300899b641153305e4d9a7230ea5f372c4',    'hr',            'TH', 1),
  ('usr-th-sup',   'th.supervisor@boxme.tech',   '$seed$sha256$9872df61cc60479463d429da66fb2946ff1093b8e19ee9119c0363608190b8f8',   'supervisor',    'TH', 1),
  ('usr-vn-admin', 'vn.admin@boxme.tech',        '$seed$sha256$30810009d322f40073f239ea02bae6615222b2e4b7b912c17f4b69ffa3a11573', 'country_admin', 'VN', 1),
  ('usr-vn-hr',    'vn.hr@boxme.tech',           '$seed$sha256$e4d9e79eb375979a462ea8eeaa644e3e961b043af3f2b3da61f27f1fc8f3d607',    'hr',            'VN', 1),
  ('usr-vn-sup',   'vn.supervisor@boxme.tech',   '$seed$sha256$3e6e9e2199b50edb90d255eba85035a76312beeb8a0b8979f1ff0db075f1f629',   'supervisor',    'VN', 1),
  ('usr-ph-admin', 'ph.admin@boxme.tech',        '$seed$sha256$ac7b6f2c55e2e063c86a6a2f95a5bb972001ccc7ac531db21a78e357d134e1f8', 'country_admin', 'PH', 1),
  ('usr-ph-hr',    'ph.hr@boxme.tech',           '$seed$sha256$0ff71c5c8a38f2506aa8c769a856f01db73b3c0d41ac1e14dbe53b0fe90acb93',    'hr',            'PH', 1),
  ('usr-ph-sup',   'ph.supervisor@boxme.tech',   '$seed$sha256$75a5adf0070615bd11f3ed516a136c763d8c60e9e2378676dae1e405bb78fbdd',   'supervisor',    'PH', 1),
  ('usr-viewer',   'viewer@boxme.tech',          '$seed$sha256$eae675ebdb74e3a5913ea881336b3235be5a57b338fce9a0dd4f7a6191a02ded',   'viewer',        '*',  1);

-- Warehouse access for TH supervisors
INSERT OR IGNORE INTO user_warehouses (user_id, warehouse_id) VALUES
  ('usr-th-sup', 'wh-th-bkk-1'),
  ('usr-th-sup', 'wh-th-bkk-2');

-- Force-update password hashes (idempotent)
UPDATE users SET password_hash='$seed$sha256$8974a98859496cb0e9b40d17294d26e9ef766409743ac8e358524a8cbb8be0f1', force_password_change=1 WHERE email='admin@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$cfa8aa5781d06cec51a405a06b1a3637a8887383b05350aa3200c43269ad307f', force_password_change=1 WHERE email='th.admin@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$fd5e70a90b9529463388c266b187b7300899b641153305e4d9a7230ea5f372c4', force_password_change=1 WHERE email='th.hr@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$9872df61cc60479463d429da66fb2946ff1093b8e19ee9119c0363608190b8f8', force_password_change=1 WHERE email='th.supervisor@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$30810009d322f40073f239ea02bae6615222b2e4b7b912c17f4b69ffa3a11573', force_password_change=1 WHERE email='vn.admin@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$e4d9e79eb375979a462ea8eeaa644e3e961b043af3f2b3da61f27f1fc8f3d607', force_password_change=1 WHERE email='vn.hr@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$3e6e9e2199b50edb90d255eba85035a76312beeb8a0b8979f1ff0db075f1f629', force_password_change=1 WHERE email='vn.supervisor@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$ac7b6f2c55e2e063c86a6a2f95a5bb972001ccc7ac531db21a78e357d134e1f8', force_password_change=1 WHERE email='ph.admin@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$0ff71c5c8a38f2506aa8c769a856f01db73b3c0d41ac1e14dbe53b0fe90acb93', force_password_change=1 WHERE email='ph.hr@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$75a5adf0070615bd11f3ed516a136c763d8c60e9e2378676dae1e405bb78fbdd', force_password_change=1 WHERE email='ph.supervisor@boxme.tech';
UPDATE users SET password_hash='$seed$sha256$eae675ebdb74e3a5913ea881336b3235be5a57b338fce9a0dd4f7a6191a02ded', force_password_change=1 WHERE email='viewer@boxme.tech';
