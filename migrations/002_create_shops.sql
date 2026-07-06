CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  etsy_shop_id TEXT,
  etsy_access_token TEXT,
  etsy_refresh_token TEXT,
  currency TEXT DEFAULT 'USD',
  is_star_seller INTEGER DEFAULT 0,
  on_vacation INTEGER DEFAULT 0,
  last_synced_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
