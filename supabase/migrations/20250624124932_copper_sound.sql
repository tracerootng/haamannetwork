/*
  # Fix RLS infinite recursion error

  1. Problem
    - RLS policies are creating infinite recursion when checking admin status
    - Policies query profiles table which has its own RLS policies
    - This creates a circular dependency loop

  2. Solution
    - Create a SECURITY DEFINER function to safely check admin status
    - Replace all admin check patterns in RLS policies with this function
    - This bypasses RLS on profiles table for admin checks

  3. Changes
    - Add is_admin_user() function with SECURITY DEFINER
    - Update all RLS policies that check admin status
    - Ensure no circular dependencies in policy checks
*/

-- Create a SECURITY DEFINER function to check if current user is admin
-- This function bypasses RLS on profiles table to prevent recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Drop and recreate all admin-related RLS policies to use the new function

-- Products policies
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Transactions policies
DROP POLICY IF EXISTS "Admins can read all transactions" ON transactions;
CREATE POLICY "Admins can read all transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can update transactions" ON transactions;
CREATE POLICY "Admins can update transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (is_admin_user());

-- Admin settings policies
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
CREATE POLICY "Admins can manage settings"
  ON admin_settings
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Admin logs policies
DROP POLICY IF EXISTS "Admins can read logs" ON admin_logs;
CREATE POLICY "Admins can read logs"
  ON admin_logs
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;
CREATE POLICY "Admins can insert logs"
  ON admin_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

-- Orders policies
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (is_admin_user());

-- Order tracking events policies
DROP POLICY IF EXISTS "Admins can manage tracking events" ON order_tracking_events;
CREATE POLICY "Admins can manage tracking events"
  ON order_tracking_events
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- API settings policies
DROP POLICY IF EXISTS "Admins can manage API settings" ON api_settings;
CREATE POLICY "Admins can manage API settings"
  ON api_settings
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Data plan categories policies
DROP POLICY IF EXISTS "Admins can manage data plan categories" ON data_plan_categories;
CREATE POLICY "Admins can manage data plan categories"
  ON data_plan_categories
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Data plans policies
DROP POLICY IF EXISTS "Admins can manage data plans" ON data_plans;
CREATE POLICY "Admins can manage data plans"
  ON data_plans
  FOR ALL
  TO authenticated
  USING (is_admin_user());