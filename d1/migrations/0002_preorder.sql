-- Pre-order support: products can be marked as ready-to-sell or available
-- for pre-order within a date range.
ALTER TABLE products ADD COLUMN availability TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE products ADD COLUMN preorder_start TEXT;
ALTER TABLE products ADD COLUMN preorder_end TEXT;

CREATE INDEX products_availability_idx ON products (availability);
