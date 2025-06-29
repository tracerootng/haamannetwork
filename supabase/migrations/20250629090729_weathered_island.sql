/*
  # Add discount fields to data plans

  1. New Columns
    - `discount_percentage` (integer) - Stores the discount percentage value
    - `show_discount_badge` (boolean) - Controls whether to display the discount badge

  2. Changes
    - Adds default values (0 for percentage, false for badge visibility)
*/

-- Add discount_percentage column with default value 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'data_plans' AND column_name = 'discount_percentage'
  ) THEN
    ALTER TABLE data_plans ADD COLUMN discount_percentage integer DEFAULT 0;
  END IF;
END $$;

-- Add show_discount_badge column with default value false
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'data_plans' AND column_name = 'show_discount_badge'
  ) THEN
    ALTER TABLE data_plans ADD COLUMN show_discount_badge boolean DEFAULT false;
  END IF;
END $$;