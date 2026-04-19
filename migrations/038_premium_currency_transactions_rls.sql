ALTER TABLE premium_currency_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own premium currency transactions" ON premium_currency_transactions;
CREATE POLICY "Users can view own premium currency transactions"
ON premium_currency_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own premium currency transactions" ON premium_currency_transactions;
CREATE POLICY "Users can insert own premium currency transactions"
ON premium_currency_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own premium currency transactions" ON premium_currency_transactions;
CREATE POLICY "Users can update own premium currency transactions"
ON premium_currency_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
