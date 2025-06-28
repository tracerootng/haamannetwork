/*
  # Support Tickets System

  1. New Tables
    - `support_tickets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `subject` (text)
      - `category` (text)
      - `status` (text)
      - `priority` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_message_at` (timestamptz)
      - `assigned_to` (uuid, references profiles)
    - `ticket_messages`
      - `id` (uuid, primary key)
      - `ticket_id` (uuid, references support_tickets)
      - `sender_id` (uuid, references profiles)
      - `message` (text)
      - `is_admin_reply` (boolean)
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own tickets
    - Add policies for admins to manage all tickets
*/

-- Check if tables already exist before creating them
DO $$
BEGIN
  -- Create support_tickets table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets') THEN
    CREATE TABLE support_tickets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      subject text NOT NULL,
      category text NOT NULL,
      status text NOT NULL DEFAULT 'open',
      priority text NOT NULL DEFAULT 'medium',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      last_message_at timestamptz DEFAULT now(),
      assigned_to uuid REFERENCES profiles(id),
      
      -- Add constraints for allowed values
      CONSTRAINT support_tickets_category_check CHECK (
        category IN ('transaction', 'order', 'referral', 'general', 'technical')
      ),
      CONSTRAINT support_tickets_status_check CHECK (
        status IN ('open', 'pending_user_reply', 'pending_admin_reply', 'closed')
      ),
      CONSTRAINT support_tickets_priority_check CHECK (
        priority IN ('low', 'medium', 'high', 'critical')
      )
    );
  END IF;

  -- Create ticket_messages table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ticket_messages') THEN
    CREATE TABLE ticket_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      sender_id uuid NOT NULL REFERENCES profiles(id),
      message text NOT NULL,
      is_admin_reply boolean NOT NULL DEFAULT false,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create or replace functions for triggers
CREATE OR REPLACE FUNCTION update_ticket_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at,
      status = CASE 
                WHEN NEW.is_admin_reply THEN 'pending_user_reply'
                ELSE 'pending_admin_reply'
              END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if triggers exist before creating them
DO $$
BEGIN
  -- Create trigger for updating ticket timestamps on new message
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_ticket_on_new_message'
  ) THEN
    CREATE TRIGGER update_ticket_on_new_message
    AFTER INSERT ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_timestamps();
  END IF;

  -- Create trigger for updating updated_at on support_tickets
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_support_tickets_updated_at'
  ) THEN
    CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_tickets_updated_at();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DO $$
BEGIN
  -- Drop policies for support_tickets
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own tickets') THEN
    DROP POLICY "Users can view their own tickets" ON support_tickets;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create tickets') THEN
    DROP POLICY "Users can create tickets" ON support_tickets;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own tickets') THEN
    DROP POLICY "Users can update their own tickets" ON support_tickets;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all tickets') THEN
    DROP POLICY "Admins can view all tickets" ON support_tickets;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can update all tickets') THEN
    DROP POLICY "Admins can update all tickets" ON support_tickets;
  END IF;
  
  -- Drop policies for ticket_messages
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view messages for their own tickets') THEN
    DROP POLICY "Users can view messages for their own tickets" ON ticket_messages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can add messages to their own tickets') THEN
    DROP POLICY "Users can add messages to their own tickets" ON ticket_messages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all messages') THEN
    DROP POLICY "Admins can view all messages" ON ticket_messages;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can add messages to any ticket') THEN
    DROP POLICY "Admins can add messages to any ticket" ON ticket_messages;
  END IF;
END $$;

-- Create policies for support_tickets
CREATE POLICY "Users can view their own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can update all tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (is_admin_user());

-- Create policies for ticket_messages
CREATE POLICY "Users can view messages for their own tickets"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add messages to their own tickets"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
      AND support_tickets.user_id = auth.uid()
    ) AND
    sender_id = auth.uid() AND
    is_admin_reply = false
  );

CREATE POLICY "Admins can view all messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can add messages to any ticket"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_user() AND
    sender_id = auth.uid()
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_category_idx ON support_tickets(category);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS support_tickets_last_message_at_idx ON support_tickets(last_message_at);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_id_idx ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS ticket_messages_sender_id_idx ON ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS ticket_messages_created_at_idx ON ticket_messages(created_at);