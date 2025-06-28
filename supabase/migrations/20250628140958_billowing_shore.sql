/*
  # Add Transaction PIN to Profiles

  1. New Columns
    - `transaction_pin` (text) - Stores the hashed transaction PIN
    - `pin_attempts` (integer) - Tracks failed PIN attempts
    - `pin_locked_until` (timestamptz) - Timestamp until when PIN is locked after too many failed attempts

  2. Security
    - PIN is stored as a bcrypt hash for security
    - Added attempt tracking to prevent brute force attacks
*/

-- Add transaction_pin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS transaction_pin text;

-- Add columns for PIN security
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_attempts integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;