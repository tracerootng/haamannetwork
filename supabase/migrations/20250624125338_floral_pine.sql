/*
  # Complete fix for RLS infinite recursion

  1. Problem
    - RLS policies are creating infinite recursion when checking admin status
    - Missing policies for regular users to read products
    - Circular dependency between products and profiles tables

  2. Solution
    - Ensure SECURITY DEFINER function exists and works correctly
    - Add proper policies for all user types
    - Remove any circular dependencies

  3. Changes
    - Recreate is_admin_user() function with proper error handling
    - Add policies for public product access
    - Update all admin policies to use the safe function
    - Ensure profiles table has proper policies
*/

-- Drop existing function if it exists and recreate with better error handling
DROP FUNCTION IF EXISTS is_admin_user();

-- Create a SECURITY DEFINER function to check if current user is admin
-- This function bypasses RLS on profiles table to prevent recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false if no user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check admin status without triggering RLS
  RETURN COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    false
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return false on any error to prevent policy failures
    RETURN false;
END;
$$;

-- Ensure profiles table has proper RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing profiles policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple, non-recursive policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure products table has proper RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop all existing product policies
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Public can read products" ON products;
DROP POLICY IF EXISTS "Users can read products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Create policies for products table
-- Allow everyone (including anonymous users) to read products
CREATE POLICY "Public can read products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow admins to manage products using the safe function
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Ensure other tables have proper policies without recursion

-- Transactions policies
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can read all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON transactions;

CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Orders policies
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Admin settings policies
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
CREATE POLICY "Admins can manage settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Admin logs policies
DROP POLICY IF EXISTS "Admins can read logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;

CREATE POLICY "Admins can read logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can insert logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Order tracking events policies
DROP POLICY IF EXISTS "Users can read own tracking events" ON order_tracking_events;
DROP POLICY IF EXISTS "Admins can manage tracking events" ON order_tracking_events;

CREATE POLICY "Users can read own tracking events"
  ON order_tracking_events
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_tracking_events.order_id 
    AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage tracking events"
  ON order_tracking_events
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- API settings policies
DROP POLICY IF EXISTS "Admins can manage API settings" ON api_settings;
CREATE POLICY "Admins can manage API settings"
  ON api_settings
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Data plan categories policies
DROP POLICY IF EXISTS "Anyone can read data plan categories" ON data_plan_categories;
DROP POLICY IF EXISTS "Admins can manage data plan categories" ON data_plan_categories;

CREATE POLICY "Anyone can read data plan categories"
  ON data_plan_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage data plan categories"
  ON data_plan_categories
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Data plans policies
DROP POLICY IF EXISTS "Anyone can read data plans" ON data_plans;
DROP POLICY IF EXISTS "Admins can manage data plans" ON data_plans;

CREATE POLICY "Anyone can read data plans"
  ON data_plans
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage data plans"
  ON data_plans
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());