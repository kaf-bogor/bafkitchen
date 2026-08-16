-- BAF Kitchen schema migration — initial tables for D1 (SQLite)
-- Time columns are stored as ISO-8601 strings ("2024-09-01T12:00:00.000Z") so
-- lexicographic comparison is equivalent to chronological ordering.
-- Nested Firestore-style objects are stored as JSON TEXT columns.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  phone_number TEXT,
  photo_url TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_sign_in_at TEXT
);

CREATE UNIQUE INDEX users_email_idx ON users (email);

CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vendor_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_base REAL,
  price REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  vendor TEXT,
  category_ids TEXT,
  description TEXT,
  image_url TEXT,
  image_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX products_created_idx ON products (created_at DESC);

CREATE TABLE product_categories (
  product_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  PRIMARY KEY (product_id, category_id)
);

CREATE INDEX product_categories_category_idx ON product_categories (category_id);

CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  products TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX schedules_date_idx ON schedules (date);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_number TEXT,
  product_orders TEXT NOT NULL DEFAULT '[]',
  total REAL NOT NULL DEFAULT 0,
  customer TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL,
  store TEXT NOT NULL DEFAULT '{}',
  vendors TEXT NOT NULL DEFAULT '[]',
  channel TEXT,
  payment TEXT,
  cashier TEXT,
  activities TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX orders_created_idx ON orders (created_at DESC);
CREATE INDEX orders_status_idx ON orders (status);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  order_id TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Issued',
  due_date TEXT,
  issued_date TEXT,
  settled_date TEXT,
  items TEXT NOT NULL DEFAULT '[]',
  customer TEXT NOT NULL DEFAULT '{}',
  commission TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX invoices_created_idx ON invoices (created_at DESC);
CREATE INDEX invoices_vendor_idx ON invoices (vendor_id);

CREATE TABLE settings (
  id TEXT PRIMARY KEY,
  admin_phone_number TEXT,
  app_name TEXT,
  app_domain TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);