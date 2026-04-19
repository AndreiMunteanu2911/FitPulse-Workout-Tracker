CREATE OR REPLACE FUNCTION process_cores_topup(
  p_user_id UUID,
  p_cores INTEGER,
  p_stripe_session_id TEXT,
  p_description TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_row_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'process_cores_topup start user_id=%, cores=%, stripe_session_id=%',
    p_user_id, p_cores, p_stripe_session_id;

  INSERT INTO premium_currency_transactions (
    user_id,
    amount,
    type,
    description,
    stripe_session_id
  )
  VALUES (
    p_user_id,
    p_cores,
    'top_up',
    p_description,
    p_stripe_session_id
  )
  ON CONFLICT (stripe_session_id) DO NOTHING;

  GET DIAGNOSTICS inserted_row_count = ROW_COUNT;

  IF inserted_row_count = 0 THEN
    RAISE NOTICE 'process_cores_topup skipped duplicate stripe_session_id=%', p_stripe_session_id;
    RETURN FALSE;
  END IF;

  INSERT INTO user_stats (user_id, cores_balance)
  VALUES (p_user_id, p_cores)
  ON CONFLICT (user_id) DO UPDATE
  SET cores_balance = COALESCE(user_stats.cores_balance, 0) + EXCLUDED.cores_balance;

  RAISE NOTICE 'process_cores_topup completed user_id=%, cores=%',
    p_user_id, p_cores;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION process_cores_topup(UUID, INTEGER, TEXT, TEXT) TO authenticated, service_role;
