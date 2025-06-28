-- Add new settings for referral rewards if they don't exist
DO $$
BEGIN
  -- Check and add referral_reward_enabled setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'referral_reward_enabled') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('referral_reward_enabled', 'true', 'Enable or disable the data reward for referrals');
  END IF;

  -- Check and add referral_reward_count setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'referral_reward_count') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('referral_reward_count', '5', 'Number of referrals required to earn the data reward');
  END IF;

  -- Check and add referral_reward_data_size setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'referral_reward_data_size') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('referral_reward_data_size', '1GB', 'Size of the data reward (e.g., 1GB, 2GB)');
  END IF;
END $$;