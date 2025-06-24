/*
  # Create beneficiaries table for saved contacts

  1. New Table
    - `beneficiaries` - Store saved contacts for quick transactions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `name` (text, beneficiary name)
      - `phone_number` (text, beneficiary phone number)
      - `network` (text, network provider)
      - `type` (text, 'airtime' or 'data')
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `beneficiaries` table
    - Add policies for users to manage their own beneficiaries
    - Add policies for admins to view all beneficiaries

  3. Indexes
    - Add index on user_id for fast lookups
    - Add index on type for filtering
    - Add index on network for filtering
*/

-- Create beneficiaries table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_number text NOT NULL,
  network text NOT NULL,
  type text NOT NULL CHECK (type IN ('airtime', 'data')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own beneficiaries"
  ON beneficiaries
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all beneficiaries"
  ON beneficiaries
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

-- Create indexes
CREATE INDEX IF NOT EXISTS beneficiaries_user_id_idx ON beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS beneficiaries_type_idx ON beneficiaries(type);
CREATE INDEX IF NOT EXISTS beneficiaries_network_idx ON beneficiaries(network);

-- Create function to create beneficiaries table if it doesn't exist
CREATE OR REPLACE FUNCTION create_beneficiaries_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'beneficiaries'
  ) THEN
    -- Create the table
    CREATE TABLE public.beneficiaries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      name text NOT NULL,
      phone_number text NOT NULL,
      network text NOT NULL,
      type text NOT NULL CHECK (type IN ('airtime', 'data')),
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can manage their own beneficiaries"
      ON public.beneficiaries
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Admins can view all beneficiaries"
      ON public.beneficiaries
      FOR SELECT
      TO authenticated
      USING (is_admin_user());

    -- Create indexes
    CREATE INDEX IF NOT EXISTS beneficiaries_user_id_idx ON public.beneficiaries(user_id);
    CREATE INDEX IF NOT EXISTS beneficiaries_type_idx ON public.beneficiaries(type);
    CREATE INDEX IF NOT EXISTS beneficiaries_network_idx ON public.beneficiaries(network);
  END IF;
END;
$$;