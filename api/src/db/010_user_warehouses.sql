-- 010: M:N user ↔ warehouse access (replaces single users.warehouse_id scoping).
-- users.warehouse_id is kept for backward compat (legacy supervisor scope); new code
-- should consult user_warehouses for accessible warehouse ids.

CREATE TABLE IF NOT EXISTS user_warehouses (
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  warehouse_id TEXT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  granted_at   TEXT NOT NULL DEFAULT (datetime('now')),
  granted_by   TEXT REFERENCES users(id),
  PRIMARY KEY (user_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_user_warehouses_user ON user_warehouses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warehouses_wh ON user_warehouses(warehouse_id);

-- Backfill: copy existing users.warehouse_id into the join table.
INSERT OR IGNORE INTO user_warehouses (user_id, warehouse_id, granted_by)
SELECT id, warehouse_id, id FROM users WHERE warehouse_id IS NOT NULL;
