-- Shorten vendor IDs to 5 characters and update every reference.

CREATE TABLE IF NOT EXISTS _vendor_id_map (
  old_id TEXT PRIMARY KEY,
  new_id TEXT NOT NULL
);

INSERT INTO _vendor_id_map (old_id, new_id)
SELECT id, 'VND' || printf('%02d', row_number() OVER (ORDER BY created_at))
FROM vendors
WHERE length(id) > 5;

-- Direct references
UPDATE categories
SET vendor_id = (SELECT new_id FROM _vendor_id_map m WHERE m.old_id = categories.vendor_id)
WHERE vendor_id IN (SELECT old_id FROM _vendor_id_map);

UPDATE invoices
SET vendor_id = (SELECT new_id FROM _vendor_id_map m WHERE m.old_id = invoices.vendor_id)
WHERE vendor_id IN (SELECT old_id FROM _vendor_id_map);

-- JSON references: products.vendor (one vendor per product)
UPDATE products
SET vendor = (
  SELECT replace(products.vendor, m.old_id, m.new_id)
  FROM _vendor_id_map m
  WHERE products.vendor LIKE '%' || m.old_id || '%'
)
WHERE EXISTS (
  SELECT 1 FROM _vendor_id_map m
  WHERE products.vendor LIKE '%' || m.old_id || '%'
);

-- JSON references: orders.vendors / orders.product_orders (may hold several vendors,
-- so repeat the pass until no old id remains).
UPDATE orders
SET vendors = (
  SELECT replace(orders.vendors, m.old_id, m.new_id)
  FROM _vendor_id_map m
  WHERE orders.vendors LIKE '%' || m.old_id || '%'
)
WHERE EXISTS (
  SELECT 1 FROM _vendor_id_map m
  WHERE orders.vendors LIKE '%' || m.old_id || '%'
);

UPDATE orders
SET vendors = (
  SELECT replace(orders.vendors, m.old_id, m.new_id)
  FROM _vendor_id_map m
  WHERE orders.vendors LIKE '%' || m.old_id || '%'
)
WHERE EXISTS (
  SELECT 1 FROM _vendor_id_map m
  WHERE orders.vendors LIKE '%' || m.old_id || '%'
);

UPDATE orders
SET vendors = (
  SELECT replace(orders.vendors, m.old_id, m.new_id)
  FROM _vendor_id_map m
  WHERE orders.vendors LIKE '%' || m.old_id || '%'
)
WHERE EXISTS (
  SELECT 1 FROM _vendor_id_map m
  WHERE orders.vendors LIKE '%' || m.old_id || '%'
);

UPDATE orders
SET product_orders = (
  SELECT replace(orders.product_orders, m.old_id, m.new_id)
  FROM _vendor_id_map m
  WHERE orders.product_orders LIKE '%' || m.old_id || '%'
)
WHERE EXISTS (
  SELECT 1 FROM _vendor_id_map m
  WHERE orders.product_orders LIKE '%' || m.old_id || '%'
);

UPDATE orders
SET product_orders = (
  SELECT replace(orders.product_orders, m.old_id, m.new_id)
  FROM _vendor_id_map m
  WHERE orders.product_orders LIKE '%' || m.old_id || '%'
)
WHERE EXISTS (
  SELECT 1 FROM _vendor_id_map m
  WHERE orders.product_orders LIKE '%' || m.old_id || '%'
);

UPDATE orders
SET product_orders = (
  SELECT replace(orders.product_orders, m.old_id, m.new_id)
  FROM _vendor_id_map m
  WHERE orders.product_orders LIKE '%' || m.old_id || '%'
)
WHERE EXISTS (
  SELECT 1 FROM _vendor_id_map m
  WHERE orders.product_orders LIKE '%' || m.old_id || '%'
);

-- Finally rename the vendor primary keys
UPDATE vendors
SET id = (SELECT new_id FROM _vendor_id_map m WHERE m.old_id = vendors.id)
WHERE id IN (SELECT old_id FROM _vendor_id_map);

DROP TABLE _vendor_id_map;
