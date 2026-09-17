-- Storefront channel: mark existing products as sold on the online storefront.
-- POS-only products (imported later) will only have the 'pos' channel.

UPDATE products
SET channels = CASE
  WHEN channels IS NULL OR channels = '' THEN 'online'
  ELSE channels || ',online'
END
WHERE channels IS NULL OR channels NOT LIKE '%online%';
