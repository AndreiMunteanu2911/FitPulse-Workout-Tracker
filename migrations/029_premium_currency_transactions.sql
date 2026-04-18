CREATE TABLE premium_currency_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL, -- Positive for earning, negative for spending
    type TEXT NOT NULL, -- 'purchase', 'achievement', 'level_up', 'admin_adjustment'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE premium_currency_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON premium_currency_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON premium_currency_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_stats
            WHERE user_stats.user_id = auth.uid() AND user_stats.role = 'admin'
        )
    );
