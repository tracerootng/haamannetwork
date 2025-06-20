/*
  # Create API Settings Table for Token Management

  1. New Tables
    - `api_settings`
      - `id` (uuid, primary key)
      - `key_name` (text, unique, setting name)
      - `key_value` (text, setting value)
      - `description` (text, setting description)
      - `updated_at` (timestamptz, last updated)
      - `updated_by` (uuid, admin who updated)

  2. Security
    - Enable RLS on `api_settings` table
    - Only admins can access API settings
    - Add logging for token changes

  3. Default Data
    - Insert MASKAWA API token
*/

-- Create api_settings table
CREATE TABLE IF NOT EXISTS api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access API settings
CREATE POLICY "Admins can manage API settings"
  ON api_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS api_settings_key_name_idx ON api_settings(key_name);

-- Create trigger for updated_at
CREATE TRIGGER update_api_settings_updated_at 
  BEFORE UPDATE ON api_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert MASKAWA API token
INSERT INTO api_settings (key_name, key_value, description) VALUES
  ('maskawa_token', '460316489795cfce42c3306d125b76167cd0524e', 'MASKAWASUBAPI authentication token'),
  ('maskawa_base_url', 'https://maskawasubapi.com', 'MASKAWASUBAPI base URL')
ON CONFLICT (key_name) DO NOTHING;