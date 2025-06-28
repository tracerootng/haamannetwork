/*
  # Create get_data_usage_leaderboard function

  1. New Functions
    - `get_data_usage_leaderboard`
      - Returns the top 10 users based on data usage spending
      - Accepts optional network filter
      - Includes current user's position in the leaderboard
  2. Purpose
    - Provides data for the leaderboard feature in the transactions page
    - Properly anonymizes user data for privacy
*/

-- Create or replace the function
CREATE OR REPLACE FUNCTION get_data_usage_leaderboard(
  network_filter text DEFAULT NULL,
  current_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  name text,
  network text,
  total_amount numeric,
  rank bigint,
  is_current_user boolean
) AS $$
DECLARE
  user_rank bigint;
BEGIN
  -- Create a temporary table with the leaderboard data
  CREATE TEMPORARY TABLE temp_leaderboard AS
  WITH data_transactions AS (
    SELECT 
      t.user_id,
      p.name,
      LOWER(t.details->>'network') AS network,
      SUM(t.amount) AS total_amount,
      ROW_NUMBER() OVER (PARTITION BY t.user_id ORDER BY COUNT(*) DESC) AS network_rank
    FROM 
      transactions t
      JOIN profiles p ON t.user_id = p.id
    WHERE 
      t.type = 'data' 
      AND t.status = 'success'
      AND (network_filter IS NULL OR LOWER(t.details->>'network') = LOWER(network_filter))
    GROUP BY 
      t.user_id, p.name, LOWER(t.details->>'network')
  ),
  user_totals AS (
    SELECT 
      user_id,
      name,
      SUM(total_amount) AS total_amount,
      (ARRAY_AGG(network ORDER BY network_rank))[1] AS most_used_network
    FROM 
      data_transactions
    GROUP BY 
      user_id, name
  ),
  ranked_users AS (
    SELECT 
      user_id,
      -- Anonymize names except for the current user
      CASE 
        WHEN user_id = current_user_id THEN name || ' (You)'
        ELSE SPLIT_PART(name, ' ', 1) || COALESCE(' ' || LEFT(SPLIT_PART(name, ' ', 2), 1), '')
      END AS name,
      most_used_network AS network,
      total_amount,
      ROW_NUMBER() OVER (ORDER BY total_amount DESC) AS rank,
      user_id = current_user_id AS is_current_user
    FROM 
      user_totals
    WHERE 
      total_amount > 0
  )
  SELECT * FROM ranked_users
  ORDER BY rank ASC
  LIMIT 10;

  -- If current_user_id is provided but not in top 10, add them to the results
  IF current_user_id IS NOT NULL THEN
    SELECT rank INTO user_rank FROM temp_leaderboard WHERE user_id = current_user_id;
    
    IF user_rank IS NULL THEN
      -- User not in top 10, get their rank and add them
      WITH user_data AS (
        SELECT 
          t.user_id,
          p.name,
          LOWER(t.details->>'network') AS network,
          SUM(t.amount) AS total_amount
        FROM 
          transactions t
          JOIN profiles p ON t.user_id = p.id
        WHERE 
          t.type = 'data' 
          AND t.status = 'success'
          AND t.user_id = current_user_id
          AND (network_filter IS NULL OR LOWER(t.details->>'network') = LOWER(network_filter))
        GROUP BY 
          t.user_id, p.name, LOWER(t.details->>'network')
        ORDER BY 
          SUM(t.amount) DESC
        LIMIT 1
      ),
      user_rank_data AS (
        SELECT 
          ud.user_id,
          ud.name || ' (You)' AS name,
          ud.network,
          ud.total_amount,
          (SELECT COUNT(*) + 1 FROM user_totals ut WHERE ut.total_amount > ud.total_amount) AS rank,
          TRUE AS is_current_user
        FROM 
          user_data ud
      )
      INSERT INTO temp_leaderboard
      SELECT * FROM user_rank_data
      WHERE total_amount > 0;
    END IF;
  END IF;

  -- Return the results
  RETURN QUERY SELECT * FROM temp_leaderboard ORDER BY rank ASC;
  
  -- Clean up
  DROP TABLE temp_leaderboard;
END;
$$ LANGUAGE plpgsql;