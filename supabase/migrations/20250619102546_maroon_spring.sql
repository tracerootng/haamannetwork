/*
  # Add referral system to profiles table

  1. Changes
    - Add `referral_code` column (text, unique, user's referral code)
    - Add `referred_by` column (uuid, nullable, references profiles.id)
    - Add `total_referrals` column (integer, default 0, count of successful referrals)
    - Add `referral_earnings` column (numeric, default 0, total earnings from referrals)

  2. Indexes
    - Add index on referral_code for fast lookups
    - Add index on referred_by for referral tracking

  3. Constraints
    - Unique constraint on referral_code
    - Foreign key constraint on referred_by
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add referral_code column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;

  -- Add referred_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by uuid REFERENCES profiles(id);
  END IF;

  -- Add total_referrals column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_referrals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_referrals integer DEFAULT 0;
  END IF;

  -- Add referral_earnings column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_earnings'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_earnings numeric DEFAULT 0;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON profiles(referred_by);

-- Create a function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_name text, user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN 'haaman-' || UPPER(REPLACE(user_name, ' ', '')) || SUBSTRING(user_id::text FROM 1 FOR 3);
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles to have referral codes if they don't have them
UPDATE profiles 
SET referral_code = generate_referral_code(name, id)
WHERE referral_code IS NULL;