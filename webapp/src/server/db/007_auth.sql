-- 007: Auth — users, sessions, audit log

CREATE TABLE IF NOT EXISTS users (
  id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  email                 TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('super_admin','country_admin','hr','supervisor','viewer')),
  country_scope         TEXT NOT NULL DEFAULT '*',  -- '*' or country code
  warehouse_id          TEXT REFERENCES warehouses(id),  -- supervisor scope
  force_password_change INTEGER NOT NULL DEFAULT 1,
  active                INTEGER NOT NULL DEFAULT 1,
  last_login_at         TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,          -- random token stored in cookie
  user_id    TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS reset_tokens (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_id     TEXT,
  user_email  TEXT,
  action      TEXT NOT NULL,  -- 'create','update','delete','login','logout','export'
  entity      TEXT NOT NULL,  -- 'worker','attendance','payroll_period', etc.
  entity_id   TEXT,
  country_code TEXT,
  before_json TEXT,           -- JSON snapshot before change
  after_json  TEXT,           -- JSON snapshot after change
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(created_at);
