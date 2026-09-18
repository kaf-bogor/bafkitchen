-- Purchases (belanja/kulakan barang) + per-purchase stock batches.
-- Each purchase document can hold many products; every line records its own
-- cost (HPP beli) and selling price so profit can be tracked per batch.

CREATE TABLE purchases (
  id TEXT PRIMARY KEY,
  purchase_number TEXT,
  supplier TEXT,
  purchase_date TEXT NOT NULL,
  note TEXT,
  total_cost REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX purchases_date_idx ON purchases (purchase_date DESC);

CREATE TABLE purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  qty INTEGER NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  sell_price REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX purchase_items_purchase_idx ON purchase_items (purchase_id);
CREATE INDEX purchase_items_product_idx ON purchase_items (product_id);

CREATE TABLE stock_batches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  purchase_item_id TEXT NOT NULL,
  qty_in INTEGER NOT NULL DEFAULT 0,
  qty_remaining INTEGER NOT NULL DEFAULT 0,
  cost_price REAL NOT NULL DEFAULT 0,
  sell_price REAL NOT NULL DEFAULT 0,
  received_at TEXT NOT NULL
);

CREATE INDEX stock_batches_product_idx ON stock_batches (product_id);
CREATE INDEX stock_batches_purchase_item_idx ON stock_batches (purchase_item_id);
