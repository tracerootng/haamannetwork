/*
  # Add Download App Settings

  1. New Settings
    - `download_app_url` - URL for the download app button
    - `download_app_enabled` - Enable/disable the download app button

  2. Security
    - Settings are managed by admin users only
*/

INSERT INTO admin_settings (key, value, description) VALUES
  ('download_app_url', 'https://play.google.com/store/apps', 'Download app button URL (Play Store, App Store, etc.)'),
  ('download_app_enabled', 'true', 'Enable or disable the download app button on homepage')
ON CONFLICT (key) DO NOTHING;