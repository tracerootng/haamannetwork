/*
  # Create transaction statistics function

  1. New Function
    - `get_user_transaction_stats` - Returns transaction statistics for a user
      - Accepts time_range parameter for filtering (7days, 30days, 90days, all)
      - Returns total spent, averages, network breakdown, and most used service
      - Calculates percentages for visualization

  2. Security
    - Function is accessible only to the user who owns the data
    - Admin users can access all user statistics
    - Only successful transactions are counted
*/

-- Create function to get user transaction statistics
CREATE OR REPLACE FUNCTION get_user_transaction_stats(
  user_id_param uuid,
  time_range text DEFAULT '30days'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  start_date timestamp;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if user has permission to view these stats
  IF current_user_id != user_id_param AND NOT is_admin_user() THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;
  
  -- Set time range filter
  IF time_range = '7days' THEN
    start_date := now() - interval '7 days';
  ELSIF time_range = '30days' THEN
    start_date := now() - interval '30 days';
  ELSIF time_range = '90days' THEN
    start_date := now() - interval '90 days';
  ELSE
    start_date := '1970-01-01'::timestamp; -- All time
  END IF;
  
  -- Calculate statistics
  WITH filtered_transactions AS (
    SELECT *
    FROM transactions
    WHERE user_id = user_id_param
      AND status = 'success'
      AND created_at >= start_date
  ),
  debit_transactions AS (
    SELECT *
    FROM filtered_transactions
    WHERE type IN ('airtime', 'data', 'electricity', 'waec', 'product_purchase')
  ),
  network_breakdown AS (
    SELECT
      LOWER(details->>'network') AS network,
      COUNT(*) AS count,
      SUM(amount) AS amount
    FROM debit_transactions
    WHERE details->>'network' IS NOT NULL
    GROUP BY LOWER(details->>'network')
  ),
  service_breakdown AS (
    SELECT
      type,
      COUNT(*) AS count,
      SUM(amount) AS amount
    FROM debit_transactions
    GROUP BY type
  ),
  daily_transactions AS (
    SELECT *
    FROM debit_transactions
    WHERE created_at >= now() - interval '1 day'
  ),
  weekly_transactions AS (
    SELECT *
    FROM debit_transactions
    WHERE created_at >= now() - interval '7 days'
  ),
  monthly_transactions AS (
    SELECT *
    FROM debit_transactions
    WHERE created_at >= now() - interval '30 days'
  ),
  total_stats AS (
    SELECT
      COALESCE(SUM(amount), 0) AS total_spent,
      COUNT(*) AS total_count
    FROM debit_transactions
  ),
  most_used_service AS (
    SELECT
      type,
      count,
      amount
    FROM service_breakdown
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT json_build_object(
    'totalSpent', (SELECT total_spent FROM total_stats),
    'dailyAverage', CASE
      WHEN (SELECT COUNT(*) FROM daily_transactions) > 0 THEN (SELECT SUM(amount) FROM daily_transactions) / (SELECT COUNT(*) FROM daily_transactions)
      ELSE 0
    END,
    'weeklyAverage', CASE
      WHEN (SELECT COUNT(*) FROM weekly_transactions) > 0 THEN (SELECT SUM(amount) FROM weekly_transactions) / 7
      ELSE 0
    END,
    'monthlyAverage', CASE
      WHEN (SELECT COUNT(*) FROM monthly_transactions) > 0 THEN (SELECT SUM(amount) FROM monthly_transactions) / 30
      ELSE 0
    END,
    'networkBreakdown', (
      SELECT json_object_agg(
        network,
        json_build_object(
          'count', count,
          'amount', amount,
          'percentage', CASE
            WHEN (SELECT total_spent FROM total_stats) > 0 THEN (amount / (SELECT total_spent FROM total_stats)) * 100
            ELSE 0
          END
        )
      )
      FROM network_breakdown
    ),
    'timeBreakdown', json_build_object(
      'daily', COALESCE((SELECT SUM(amount) FROM daily_transactions), 0),
      'weekly', COALESCE((SELECT SUM(amount) FROM weekly_transactions), 0),
      'monthly', COALESCE((SELECT SUM(amount) FROM monthly_transactions), 0)
    ),
    'mostUsedService', (
      SELECT json_build_object(
        'type', type,
        'count', count,
        'amount', amount
      )
      FROM most_used_service
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_transaction_stats(uuid, text) TO authenticated;