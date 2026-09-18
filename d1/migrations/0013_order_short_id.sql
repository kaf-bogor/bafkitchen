-- Short, readable order ids: <first letter of month><globally incrementing number>.
-- Example: s1, s2, ... (September). The sequence never resets so ids stay unique.
-- Existing orders are renumbered in creation order; invoice references follow.

CREATE TABLE _order_id_map AS
SELECT
  id AS old_id,
  (
    CASE strftime('%m', created_at)
      WHEN '01' THEN 'j'
      WHEN '02' THEN 'f'
      WHEN '03' THEN 'm'
      WHEN '04' THEN 'a'
      WHEN '05' THEN 'm'
      WHEN '06' THEN 'j'
      WHEN '07' THEN 'j'
      WHEN '08' THEN 'a'
      WHEN '09' THEN 's'
      WHEN '10' THEN 'o'
      WHEN '11' THEN 'n'
      ELSE 'd'
    END
  ) || CAST(ROW_NUMBER() OVER (ORDER BY created_at ASC) AS TEXT) AS new_id
FROM orders;

UPDATE invoices
SET order_id = (
  SELECT m.new_id FROM _order_id_map m WHERE m.old_id = invoices.order_id
)
WHERE order_id IN (SELECT old_id FROM _order_id_map);

UPDATE orders
SET id = (SELECT m.new_id FROM _order_id_map m WHERE m.old_id = orders.id);

DROP TABLE _order_id_map;
