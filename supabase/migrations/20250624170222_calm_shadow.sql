/*
  # Fix order tracking events RLS policies

  1. Changes
    - Drop the existing restrictive admin-only policy
    - Create a new policy for admins to manage all tracking events
    - Add a policy for users to insert tracking events for their own orders
    - Keep the existing policy for users to view their own tracking events

  2. Security
    - Maintain security by ensuring users can only access their own data
    - Allow the system to create initial tracking events via database trigger
    - Preserve admin capabilities to manage all tracking events
*/

-- Drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Admins can manage tracking events" ON order_tracking_events;

-- Create separate policy for admin management
CREATE POLICY "Admins can manage all tracking events"
  ON order_tracking_events
  FOR ALL
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Allow users to insert tracking events for their own orders
-- First check if the policy already exists to avoid the error
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'order_tracking_events' 
    AND policyname = 'Users can create tracking events for own orders'
  ) THEN
    EXECUTE $policy$
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
    $policy$;
  END IF;
END
$$;