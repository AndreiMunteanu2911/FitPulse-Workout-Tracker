ALTER TABLE premium_currency_transactions
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS premium_currency_transactions_stripe_session_id_key
ON premium_currency_transactions (stripe_session_id);
