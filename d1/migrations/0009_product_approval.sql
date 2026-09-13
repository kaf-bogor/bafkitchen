-- Vendor-submitted products require admin approval before appearing publicly.
-- Existing products default to 'approved'. Values: 'pending' | 'approved' | 'rejected'.

ALTER TABLE products ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved';

CREATE INDEX products_approval_idx ON products (approval_status);
