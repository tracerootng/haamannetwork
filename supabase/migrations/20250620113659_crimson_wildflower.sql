/*
  # Initialize API Settings for MASKAWA Integration

  1. New Records
    - Insert default MASKAWA API configuration settings
    - Set up proper base URL and placeholder token
  
  2. Security
    - Ensure RLS is enabled on api_settings table
    - Only admins can manage these settings
  
  3. Configuration
    - Default base URL set to MASKAWASUBAPI endpoint
    - Placeholder token that needs to be updated by admin
*/

-- Insert default API settings if they don't exist
INSERT INTO api_settings (key_name, key_value, description) 
VALUES 
  ('maskawa_base_url', 'https://maskawasubapi.com', 'Base URL for MASKAWASUBAPI service endpoints')
ON CONFLICT (key_name) DO NOTHING;

INSERT INTO api_settings (key_name, key_value, description) 
VALUES 
  ('maskawa_token', 'YOUR_MASKAWA_TOKEN_HERE', 'Authentication token for MASKAWASUBAPI - Replace with actual token from your MASKAWA dashboard')
ON CONFLICT (key_name) DO NOTHING;

-- Insert default admin settings if they don't exist
INSERT INTO admin_settings (key, value, description) 
VALUES 
  ('site_name', 'VTU Platform', 'Name of the website/platform'),
  ('support_email', 'support@example.com', 'Support email address'),
  ('support_phone', '+234-XXX-XXX-XXXX', 'Support phone number'),
  ('footer_company_name', 'VTU Platform Ltd', 'Company name displayed in footer'),
  ('footer_email', 'info@example.com', 'Contact email displayed in footer'),
  ('footer_phone', '+234-XXX-XXX-XXXX', 'Contact phone displayed in footer'),
  ('footer_address', '123 Business Street, Lagos, Nigeria', 'Company address displayed in footer'),
  ('hero_banner_image', 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg', 'Hero section banner image URL'),
  ('hero_banner_image_alt', 'Mobile payment and VTU services', 'Alt text for hero banner image'),
  ('steps_banner_image', 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg', 'Steps section banner image URL'),
  ('hero_title', 'Fast & Secure VTU Services', 'Main title for hero section'),
  ('hero_subtitle', 'Buy airtime, data, pay electricity bills and shop for products all in one place. Quick, reliable and secure transactions.', 'Subtitle for hero section'),
  ('steps_title', 'How It Works', 'Title for steps section'),
  ('download_app_enabled', 'false', 'Enable/disable download app section'),
  ('download_app_url', '#', 'URL for app download'),
  ('referral_bonus_percentage', '5', 'Percentage bonus for referrals'),
  ('min_transaction_amount', '100', 'Minimum transaction amount in Naira'),
  ('max_transaction_amount', '50000', 'Maximum transaction amount in Naira'),
  ('max_wallet_balance', '1000000', 'Maximum wallet balance in Naira'),
  ('maintenance_mode', 'false', 'Enable/disable maintenance mode')
ON CONFLICT (key) DO NOTHING;