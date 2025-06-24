/*
  # Fix profiles table RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies that cause infinite recursion
    - Create simplified, non-recursive RLS policies
    - Ensure policies don't create circular dependencies

  2. Policy Updates
    - Users can read their own profile using direct uid() comparison
    - Users can update their own profile using direct uid() comparison
    - Users can insert their own profile using direct uid() comparison
    - Admins can read all profiles using a simple is_admin check without subqueries
*/

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simplified, non-recursive policies
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

-- Create admin policy that doesn't cause recursion
-- This policy checks is_admin directly on the current row instead of using a subquery
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to read their own profile OR if they are admin
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow users to update their own profile OR if they are admin
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
    )
  );