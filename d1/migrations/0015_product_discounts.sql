-- Product discounts: time- and quantity-based rules.
-- type: 'percentage' (value = percent, e.g. 10) | 'fixed' (value = rupiah per unit, e.g. 5000)
-- min_quantity: minimum quantity in cart for the rule to apply (tiering via multiple rows)
-- start_date/end_date: 'YYYY-MM-DD' (Asia/Jakarta), null = unbounded

CREATE TABLE product_discounts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT,
  type TEXT NOT NULL DEFAULT 'percentage',
  value REAL NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 1,
  start_date TEXT,
  end_date TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX product_discounts_product_idx ON product_discounts (product_id);
CREATE INDEX product_discounts_active_idx ON product_discounts (is_active);
