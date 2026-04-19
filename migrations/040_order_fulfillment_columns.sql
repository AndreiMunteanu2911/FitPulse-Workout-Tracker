ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS amount_cores INTEGER;

CREATE INDEX IF NOT EXISTS orders_payment_method_idx
ON orders (payment_method);
