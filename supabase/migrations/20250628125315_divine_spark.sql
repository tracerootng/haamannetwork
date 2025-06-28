/*
  # Referral System Improvements

  1. New Functions
    - `check_referral_limit` - Checks if a user has reached their referral limit
    - `get_referral_leaderboard` - Gets top referral earners for the leaderboard

  2. Security
    - Enable execute permissions for authenticated users
*/

-- Function to check if a user has reached their referral limit
CREATE OR REPLACE FUNCTION check_referral_limit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_total_referrals integer;
  required_referrals integer;
  invite_limit integer;
  has_claimed boolean;
BEGIN
  -- Get user's current referral count
  SELECT total_referrals INTO user_total_referrals
  FROM profiles
  WHERE id = user_id;
  
  -- Get required referrals for reward from settings
  SELECT COALESCE(value::integer, 5) INTO required_referrals
  FROM admin_settings
  WHERE key = 'referral_reward_count';
  
  -- Get invite limit from settings
  SELECT COALESCE(value::integer, 5) INTO invite_limit
  FROM admin_settings
  WHERE key = 'referral_invite_limit';
  
  -- Check if user has already claimed a reward
  SELECT EXISTS (
    SELECT 1 FROM referral_rewards
    WHERE user_id = check_referral_limit.user_id
    AND status = 'claimed'
  ) INTO has_claimed;
  
  -- If user has claimed a reward, check against invite_limit
  -- If not claimed, check against required_referrals
  IF has_claimed THEN
    RETURN user_total_referrals < invite_limit;
  ELSE
    RETURN user_total_referrals < required_referrals;
  END IF;
END;
$$;

-- Function to get referral leaderboard
CREATE OR REPLACE FUNCTION get_referral_leaderboard(current_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  name text,
  total_referrals integer,
  referral_earnings numeric,
  rank integer,
  is_current_user boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      p.id as user_id,
      CASE 
        WHEN p.id = current_user_id THEN p.name || ' (You)'
        ELSE SPLIT_PART(p.name, ' ', 1) || ' ' || COALESCE(LEFT(SPLIT_PART(p.name, ' ', 2), 1), '')
      END as masked_name,
      p.total_referrals,
      p.referral_earnings,
      ROW_NUMBER() OVER (ORDER BY p.referral_earnings DESC) as user_rank,
      (p.id = current_user_id) as is_current_user
    FROM profiles p
    WHERE p.total_referrals > 0 OR p.referral_earnings > 0
  )
  SELECT 
    ru.user_id,
    ru.masked_name,
    ru.total_referrals,
    ru.referral_earnings,
    ru.user_rank::integer,
    ru.is_current_user
  FROM ranked_users ru
  WHERE ru.user_rank <= 10 
     OR ru.user_id = current_user_id
  ORDER BY ru.user_rank;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_referral_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_leaderboard(uuid) TO authenticated;