CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL REFERENCES shops(id),
  etsy_review_id TEXT,
  buyer_name TEXT,
  rating INTEGER,
  review_text TEXT,
  review_date TEXT,
  shop_response TEXT,
  responded_at TEXT,
  flagged INTEGER DEFAULT 0
);
