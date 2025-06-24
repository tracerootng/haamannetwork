/*
  # Add Virtual Account Support for Wallet Funding

  1. New Columns
    - Add virtual account columns to profiles table
    - Add Flutterwave transaction reference to transactions table

  2. Security
    - Maintain existing RLS policies
    - Ensure users can only access their own virtual account details

  3. Changes
    - Add virtual_account_bank_name to profiles
    - Add virtual_account_number to profiles
    - Add virtual_account_reference to profiles
    - Add bvn to profiles (for permanent virtual accounts)
    - Add flutterwave_tx_ref to transactions
*/

-- Add virtual account columns to profiles table
DO $$
BEGIN
  -- Add virtual_account_bank_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'virtual_account_bank_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN virtual_account_bank_name text;
  END IF;

  -- Add virtual_account_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'virtual_account_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN virtual_account_number text;
  END IF;

  -- Add virtual_account_reference column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'virtual_account_reference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN virtual_account_reference text;
  END IF;

  -- Add bvn column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bvn'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bvn text;
  END IF;
END $$;

-- Add flutterwave_tx_ref to transactions table
DO $$
BEGIN
  -- Add flutterwave_tx_ref column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'flutterwave_tx_ref'
  ) THEN
    ALTER TABLE transactions ADD COLUMN flutterwave_tx_ref text;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS profiles_virtual_account_reference_idx ON profiles(virtual_account_reference);
CREATE INDEX IF NOT EXISTS transactions_flutterwave_tx_ref_idx ON transactions(flutterwave_tx_ref);