-- Stock opname (physical inventory count) per product.
-- A session snapshots the system stock for a filtered set of products; the
-- admin records physical counts and finalizing sets products.stock to counted.

CREATE TABLE stock_opnames (
  id TEXT PRIMARY KEY,
  opname_number TEXT,
  opname_date TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  filters TEXT NOT NULL DEFAULT '{}',
  total_products INTEGER NOT NULL DEFAULT 0,
  total_difference INTEGER NOT NULL DEFAULT 0,
  finalized_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX stock_opnames_created_idx ON stock_opnames (created_at DESC);

CREATE TABLE stock_opname_items (
  id TEXT PRIMARY KEY,
  opname_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT,
  sku TEXT,
  unit TEXT,
  system_stock INTEGER NOT NULL DEFAULT 0,
  counted_stock INTEGER,
  difference INTEGER,
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX stock_opname_items_opname_idx ON stock_opname_items (opname_id);
CREATE INDEX stock_opname_items_product_idx ON stock_opname_items (product_id);
