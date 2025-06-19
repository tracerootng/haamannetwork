/*
  # Create profiles table for user data

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text, user's display name)
      - `email` (text, unique, user's email address)
      - `phone` (text, nullable, user's phone number)
      - `wallet_balance` (numeric, default 0, user's wallet balance)
      - `is_admin` (boolean, default false, admin status)
      - `created_at` (timestamptz, default now(), creation timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policy for users to read their own profile data
    - Add policy for users to insert their own profile data
    - Add policy for users to update their own profile data

  3. Constraints
    - Foreign key constraint linking profiles.id to auth.users.id
    - Unique constraint on email field
    - Default values for wallet_balance and is_admin
*/

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  wallet_balance numeric DEFAULT 0,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);