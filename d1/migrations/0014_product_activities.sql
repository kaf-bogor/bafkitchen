-- Product edit history: JSON array of activity entries (who changed what).
ALTER TABLE products ADD COLUMN activities TEXT NOT NULL DEFAULT '[]';
