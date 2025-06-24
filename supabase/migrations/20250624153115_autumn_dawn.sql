/*
  # Add Flutterwave API Settings

  1. New Settings
    - Add Flutterwave public key and encryption key to api_settings table
    - These keys will be manageable through the admin dashboard

  2. Security
    - Keys are only accessible to admin users through RLS policies
    - Encryption key is sensitive and will be displayed as a password field
*/

-- Insert Flutterwave API settings
INSERT INTO api_settings (key_name, key_value, description) VALUES
  ('flutterwave_public_key', 'FLWPUBK-8e8ffa9525113016e99fd89b74340fc0-X', 'Flutterwave public key for client-side integration'),
  ('flutterwave_encryption_key', '1f4854529ee708f72f061bab', 'Flutterwave encryption key for securing payment data')
ON CONFLICT (key_name) DO NOTHING;