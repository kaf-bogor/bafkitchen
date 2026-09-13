-- Payment proof (bukti pembayaran) attached to an order.
-- Uploaded when confirming payment; can be replaced later.

ALTER TABLE orders ADD COLUMN payment_proof_url TEXT;
ALTER TABLE orders ADD COLUMN payment_proof_key TEXT;
