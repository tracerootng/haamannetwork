-- Add new settings for referral rewards if they don't exist
DO $$
BEGIN
  -- Check and add referral_reward_type setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'referral_reward_type') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('referral_reward_type', 'data_bundle', 'Type of reward for referrals (data_bundle, airtime, wallet_credit)');
  END IF;

  -- Check and add referral_reward_airtime_amount setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'referral_reward_airtime_amount') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('referral_reward_airtime_amount', '1000', 'Amount of airtime to reward (in local currency)');
  END IF;

  -- Check and add referral_reward_cash_amount setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'referral_reward_cash_amount') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('referral_reward_cash_amount', '1000', 'Amount of cash to reward (in local currency)');
  END IF;
END $$;

-- Add constraint to referral_rewards table to validate reward_type
ALTER TABLE referral_rewards
ADD CONSTRAINT referral_rewards_reward_type_check
CHECK (reward_type IN ('data_bundle', 'airtime', 'wallet_credit'));