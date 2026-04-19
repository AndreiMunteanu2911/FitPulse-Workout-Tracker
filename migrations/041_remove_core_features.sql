-- =============================================================================
-- Migration 041: remove_core_features
-- This migration removes all database schema elements related to the 'Cores' premium currency.
-- =============================================================================

-- 1. Drop RLS policies for premium_currency_transactions table
--    These policies must be dropped before the table itself to avoid potential conflicts.
DROP POLICY IF EXISTS "Users can view own premium currency transactions" ON premium_currency_transactions;
DROP POLICY IF EXISTS "Users can insert own premium currency transactions" ON premium_currency_transactions;
DROP POLICY IF EXISTS "Users can update own premium currency transactions" ON premium_currency_transactions;

-- 2. Drop the sync_cores_balance trigger from premium_currency_transactions
--    This trigger was managed by 029_premium_currency_transactions.sql
DROP TRIGGER IF EXISTS sync_cores_balance ON premium_currency_transactions;

-- 3. Drop the premium_currency_transactions table
--    This table stored all transactions related to Cores.
DROP TABLE IF EXISTS premium_currency_transactions;

-- 4. Drop the process_cores_topup function
--    This function was defined in 034_process_cores_topup.sql and handled Stripe callbacks for core purchases.
DROP FUNCTION IF EXISTS process_cores_topup(UUID, INTEGER, TEXT, TEXT);

-- 5. Drop the update_cores_balance function
--    This function was defined in 013_user_stats.sql and updated the cores_balance in user_stats.
DROP FUNCTION IF EXISTS update_cores_balance();

-- 6. Drop cores_balance column from public.user_stats table
--    This column stored the current Cores balance for each user.
ALTER TABLE public.user_stats
DROP COLUMN IF EXISTS cores_balance;

-- 7. Drop price_cores column from products table
--    This column stored the price of a product in Cores.
ALTER TABLE products
DROP COLUMN IF EXISTS price_cores;

-- 8. Drop amount_cores column from orders table
--    This column stored the amount of Cores used in an order.
ALTER TABLE orders
DROP COLUMN IF EXISTS amount_cores;

-- 9. Drop cores_reward column from public.achievements table
--    This column was intended to store Cores awarded for achievements, if it existed.
ALTER TABLE public.achievements
DROP COLUMN IF EXISTS cores_reward;