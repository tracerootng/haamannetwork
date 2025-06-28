/*
  # Add funding charges settings

  1. New Settings
    - Add settings for wallet funding charges configuration
    - Includes charge type, value, min/max deposit amounts, and display text
  
  2. Security
    - All settings are protected by existing RLS policies
*/

-- Add new settings for funding charges if they don't exist
DO $$
BEGIN
  -- Check and add funding_charge_enabled setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'funding_charge_enabled') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('funding_charge_enabled', 'false', 'Enable or disable charges for wallet funding');
  END IF;

  -- Check and add funding_charge_type setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'funding_charge_type') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('funding_charge_type', 'percentage', 'Type of charge for wallet funding (percentage or fixed)');
  END IF;

  -- Check and add funding_charge_value setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'funding_charge_value') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('funding_charge_value', '1.5', 'Value of the charge (percentage or fixed amount)');
  END IF;

  -- Check and add funding_charge_min_deposit setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'funding_charge_min_deposit') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('funding_charge_min_deposit', '1000', 'Minimum deposit amount for charges to apply (0 for no minimum)');
  END IF;

  -- Check and add funding_charge_max_deposit setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'funding_charge_max_deposit') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('funding_charge_max_deposit', '0', 'Maximum deposit amount for charges to apply (0 for no maximum)');
  END IF;

  -- Check and add funding_charge_display_text setting
  IF NOT EXISTS (SELECT 1 FROM admin_settings WHERE key = 'funding_charge_display_text') THEN
    INSERT INTO admin_settings (key, value, description)
    VALUES ('funding_charge_display_text', 'A service charge applies to wallet funding transactions.', 'Custom text to display to users about funding charges');
  END IF;
END $$;

-- Add flutterwave_tx_ref column to transactions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'flutterwave_tx_ref'
  ) THEN
    ALTER TABLE transactions ADD COLUMN flutterwave_tx_ref TEXT;
    CREATE INDEX IF NOT EXISTS transactions_flutterwave_tx_ref_idx ON transactions(flutterwave_tx_ref);
  END IF;
END $$;