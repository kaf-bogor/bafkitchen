-- Unified catalog + pre-order/catering support.
-- Products gain selling config (channels, availability, pre-order rules).
-- Orders gain fulfillment metadata for scheduled/pre-order sales.

-- Product fields
ALTER TABLE products ADD COLUMN sku TEXT;
ALTER TABLE products ADD COLUMN unit TEXT NOT NULL DEFAULT 'pcs';
ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

-- Sales channels: comma-separated list, e.g. 'pos,preorder' (matches single-channel products too)
ALTER TABLE products ADD COLUMN channels TEXT NOT NULL DEFAULT 'pos';

-- Availability type: 'always' | 'weekly' | 'specific'
ALTER TABLE products ADD COLUMN availability_type TEXT NOT NULL DEFAULT 'always';

-- Weekly availability: JSON array of weekday numbers 0-6 (0=Sunday) e.g. '[1,3,5]'
ALTER TABLE products ADD COLUMN weekly_days TEXT;

-- Specific availability dates: JSON array of ISO date strings e.g. '["2026-08-17","2026-08-24"]'
ALTER TABLE products ADD COLUMN specific_dates TEXT;

-- Pre-order rules
ALTER TABLE products ADD COLUMN preorder_lead_days INTEGER;        -- minimum H-X lead time
ALTER TABLE products ADD COLUMN preorder_cutoff_time TEXT;         -- e.g. '14:00'
ALTER TABLE products ADD COLUMN preorder_min_qty INTEGER;
ALTER TABLE products ADD COLUMN preorder_max_qty INTEGER;
ALTER TABLE products ADD COLUMN preorder_capacity INTEGER;         -- per-day capacity

-- Fulfillment type: 'takeaway' | 'delivery' | 'catering'
ALTER TABLE products ADD COLUMN fulfillment_type TEXT NOT NULL DEFAULT 'takeaway';

-- Order fulfillment date for pre-order / scheduled sales
ALTER TABLE orders ADD COLUMN fulfillment_date TEXT;

CREATE INDEX products_active_idx ON products (is_active);
CREATE INDEX orders_fulfillment_date_idx ON orders (fulfillment_date);
