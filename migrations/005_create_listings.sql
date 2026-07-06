CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  etsy_listing_id TEXT,
  title TEXT,
  price REAL,
  quantity INTEGER,
  views INTEGER,
  status TEXT DEFAULT 'active',
  thumbnail_url TEXT
);
