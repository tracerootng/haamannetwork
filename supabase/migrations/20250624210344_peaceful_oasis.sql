/*
  # Create leaderboard function for data usage

  1. New Function
    - `get_data_usage_leaderboard` - Returns top users by data spending
      - Accepts optional network parameter for filtering
      - Returns anonymized user data for privacy
      - Includes rank, total amount, and network information

  2. Security
    - Function is accessible to all authenticated users
    - User identities are protected (only partial names shown)
    - Only successful transactions are counted
*/

-- Create function to get data usage leaderboard
CREATE OR REPLACE FUNCTION get_data_usage_leaderboard(network_filter text DEFAULT NULL)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  partial_name text,
  network text,
  total_amount numeric,
  is_current_user boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  RETURN QUERY
  WITH user_data_spending AS (
    SELECT
      p.id AS user_id,
      p.name,
      -- Get most used network
      (
        SELECT details->>'network'
        FROM transactions t
        WHERE t.user_id = p.id
          AND t.type = 'data'
          AND t.status = 'success'
        GROUP BY details->>'network'
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) AS most_used_network,
      -- Calculate total spending on data
      COALESCE(
        (
          SELECT SUM(amount)
          FROM transactions t
          WHERE t.user_id = p.id
            AND t.type = 'data'
            AND t.status = 'success'
            AND (network_filter IS NULL OR LOWER(t.details->>'network') = LOWER(network_filter))
        ),
        0
      ) AS total_amount
    FROM profiles p
  ),
  ranked_users AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY total_amount DESC) AS rank,
      user_id,
      name,
      most_used_network,
      total_amount,
      user_id = current_user_id AS is_current_user
    FROM user_data_spending
    WHERE total_amount > 0
  )
  SELECT
    rank,
    user_id,
    -- Anonymize names for privacy
    CASE
      WHEN is_current_user THEN name || ' (You)'
      ELSE SPLIT_PART(name, ' ', 1) || ' ' || LEFT(COALESCE(SPLIT_PART(name, ' ', 2), ''), 1) || '.'
    END AS partial_name,
    COALESCE(most_used_network, 'unknown') AS network,
    total_amount,
    is_current_user
  FROM ranked_users
  ORDER BY rank
  LIMIT 5;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_data_usage_leaderboard(text) TO authenticated;