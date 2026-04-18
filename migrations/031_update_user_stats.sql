ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS cores_balance INTEGER DEFAULT 0;

-- Function to sync cores_balance
CREATE OR REPLACE FUNCTION update_cores_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_stats
        SET cores_balance = cores_balance + NEW.amount
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_stats
        SET cores_balance = cores_balance - OLD.amount
        WHERE user_id = OLD.user_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE user_stats
        SET cores_balance = cores_balance - OLD.amount + NEW.amount
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS sync_cores_balance ON premium_currency_transactions;
CREATE TRIGGER sync_cores_balance
AFTER INSERT OR UPDATE OR DELETE ON premium_currency_transactions
FOR EACH ROW EXECUTE FUNCTION update_cores_balance();
