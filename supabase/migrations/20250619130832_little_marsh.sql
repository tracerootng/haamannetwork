/*
  # Order Tracking Timeline System

  1. New Tables
    - `order_tracking_events`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `status` (text, order status)
      - `title` (text, event title)
      - `description` (text, event description)
      - `event_date` (timestamp, when the event occurred)
      - `created_by` (uuid, admin who created the event)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `order_tracking_events` table
    - Add policies for admin management and user viewing
*/

CREATE TABLE IF NOT EXISTS order_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_tracking_events ENABLE ROW LEVEL SECURITY;

-- Admins can manage all tracking events
CREATE POLICY "Admins can manage tracking events"
  ON order_tracking_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Users can view tracking events for their own orders
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS order_tracking_events_order_id_idx ON order_tracking_events(order_id);
CREATE INDEX IF NOT EXISTS order_tracking_events_status_idx ON order_tracking_events(status);
CREATE INDEX IF NOT EXISTS order_tracking_events_event_date_idx ON order_tracking_events(event_date);

-- Function to automatically create initial tracking event when order is created
CREATE OR REPLACE FUNCTION create_initial_tracking_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO order_tracking_events (
    order_id,
    status,
    title,
    description,
    event_date
  ) VALUES (
    NEW.id,
    'pending',
    'Order Placed',
    'Your order has been successfully placed and is being reviewed.',
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create initial tracking event
DROP TRIGGER IF EXISTS create_initial_tracking_event_trigger ON orders;
CREATE TRIGGER create_initial_tracking_event_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_tracking_event();