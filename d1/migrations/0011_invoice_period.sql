-- Invoice types: one transaction invoice per order (items carry their own vendor),
-- plus consolidated vendor invoices over a date range.

ALTER TABLE invoices ADD COLUMN type TEXT NOT NULL DEFAULT 'transaction';
ALTER TABLE invoices ADD COLUMN period_start TEXT;
ALTER TABLE invoices ADD COLUMN period_end TEXT;
ALTER TABLE invoices ADD COLUMN order_ids TEXT NOT NULL DEFAULT '[]';

-- Order flow simplified: shipping step removed, delivery renamed to pickup.
UPDATE orders
SET status = 'Order Processing'
WHERE status IN ('Order Shipped', 'Order Delivered');
