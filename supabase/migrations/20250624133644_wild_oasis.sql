/*
  # Fix profiles table RLS policies

  1. Security Updates
    - Drop existing problematic policies that reference non-existent users table
    - Create new simplified policies that work with Supabase auth
    - Ensure users can read and update their own profiles
    - Ensure admins can manage all profiles using the is_admin_user() function

  2. Policy Changes
    - Remove policies that reference auth.users table directly
    - Use auth.uid() function for user identification
    - Maintain admin access through is_admin_user() function
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new working policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (is_admin_user());