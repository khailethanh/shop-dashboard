CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  etsy_order_id TEXT,
  buyer_name TEXT,
  order_date TEXT,
  total REAL,
  status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  notes TEXT,
  tracking_number TEXT,
  carrier TEXT,
  fulfilled_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
