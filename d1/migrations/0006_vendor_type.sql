-- Vendor type: which kitchen/brand the vendor belongs to.
-- Values: 'bafkitchen' | 'bazaf' | 'both'

ALTER TABLE vendors ADD COLUMN type TEXT NOT NULL DEFAULT 'bazaf';

UPDATE vendors SET type = 'bafkitchen' WHERE lower(name) LIKE '%baf%';
