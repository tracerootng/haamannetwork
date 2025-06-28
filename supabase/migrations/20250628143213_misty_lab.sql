-- Add transaction_pin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS transaction_pin text;

-- Add columns for PIN security
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_attempts integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;