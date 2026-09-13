-- General marketplace categories for the Kuttab community (wali santri).
-- These are vendor-agnostic (vendor_id IS NULL) and available to every vendor
-- when tagging products. Idempotent: skips names that already exist as general.

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Makanan', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Makanan' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Minuman', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Minuman' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Kue & Snack', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Kue & Snack' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Frozen Food', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Frozen Food' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Buah & Sayur', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Buah & Sayur' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Alat Tulis', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Alat Tulis' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Buku & Alat Belajar', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Buku & Alat Belajar' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Seragam & Pakaian', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Seragam & Pakaian' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Perlengkapan Ibadah', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Perlengkapan Ibadah' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Perlengkapan Mandi', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Perlengkapan Mandi' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Perlengkapan Bayi & Anak', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Perlengkapan Bayi & Anak' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Elektronik & Aksesoris', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Elektronik & Aksesoris' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Jasa', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Jasa' AND vendor_id IS NULL);

INSERT INTO categories (id, name, vendor_id, created_at, updated_at)
SELECT lower(hex(randomblob(16))), 'Lainnya', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Lainnya' AND vendor_id IS NULL);
