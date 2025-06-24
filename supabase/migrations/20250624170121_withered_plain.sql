/*
  # Fix RLS policy for order tracking events

  1. Security Updates
    - Update RLS policy to allow system to create initial tracking events
    - Allow authenticated users to insert tracking events for their own orders
    - Maintain security by ensuring users can only create events for orders they own

  2. Changes
    - Drop existing restrictive INSERT policy
    - Create new INSERT policy that allows users to create tracking events for their own orders
    - This will allow the trigger to work properly when creating initial tracking events
*/

-- Drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Admins can manage tracking events" ON order_tracking_events;

-- Create separate policies for different operations
CREATE POLICY "Admins can manage all tracking events"
  ON order_tracking_events
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Allow users to insert tracking events for their own orders
CREATE POLICY "Users can create tracking events for own orders"
  ON order_tracking_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_tracking_events.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Allow users to view tracking events for their own orders (keep existing policy)
CREATE POLICY "Users can view own order tracking events"
  ON order_tracking_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_tracking_events.order_id 
      AND orders.user_id = auth.uid()
    )
  );