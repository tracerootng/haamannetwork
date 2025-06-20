/*
  # Create data plans system with admin profit controls

  1. New Tables
    - `data_plans` - Store all available data plans with pricing
    - `data_plan_categories` - Organize plans by network and type

  2. Features
    - Real pricing from MASKAWA API
    - Admin profit margin controls
    - User-friendly plan selection
    - Search and filter capabilities

  3. Security
    - Enable RLS on all tables
    - Admin-only access for plan management
    - Public read access for plan selection
*/

-- Create data plan categories table
CREATE TABLE IF NOT EXISTS data_plan_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text NOT NULL,
  plan_type text NOT NULL,
  display_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create data plans table
CREATE TABLE IF NOT EXISTS data_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id integer UNIQUE NOT NULL, -- MASKAWA API plan ID
  network text NOT NULL,
  plan_type text NOT NULL,
  size text NOT NULL, -- e.g., "1.0 GB", "500.0 MB"
  validity text NOT NULL, -- e.g., "30 days", "7 days"
  cost_price numeric NOT NULL, -- Original price from MASKAWA
  selling_price numeric NOT NULL, -- Price shown to users (cost + profit)
  profit_margin numeric DEFAULT 0, -- Admin-configurable profit margin
  description text,
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE data_plan_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_plans ENABLE ROW LEVEL SECURITY;

-- Public read access for plan selection
CREATE POLICY "Anyone can read active data plan categories"
  ON data_plan_categories
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Anyone can read active data plans"
  ON data_plans
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Admin management policies
CREATE POLICY "Admins can manage data plan categories"
  ON data_plan_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage data plans"
  ON data_plans
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
CREATE INDEX IF NOT EXISTS data_plan_categories_network_idx ON data_plan_categories(network);
CREATE INDEX IF NOT EXISTS data_plan_categories_active_idx ON data_plan_categories(is_active);
CREATE INDEX IF NOT EXISTS data_plans_network_idx ON data_plans(network);
CREATE INDEX IF NOT EXISTS data_plans_active_idx ON data_plans(is_active);
CREATE INDEX IF NOT EXISTS data_plans_external_id_idx ON data_plans(external_id);
CREATE INDEX IF NOT EXISTS data_plans_popular_idx ON data_plans(is_popular);

-- Create trigger for updated_at
CREATE TRIGGER update_data_plans_updated_at 
  BEFORE UPDATE ON data_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert data plan categories
INSERT INTO data_plan_categories (network, plan_type, display_name, description, sort_order) VALUES
  ('MTN', 'SME', 'MTN SME Data', 'Affordable MTN data plans', 1),
  ('MTN', 'CORPORATE GIFTING', 'MTN Corporate', 'MTN corporate data plans', 2),
  ('MTN', 'GIFTING', 'MTN Gifting', 'MTN direct gifting plans', 3),
  ('MTN', 'DATA COUPONS', 'MTN Coupons', 'MTN data coupon plans', 4),
  ('MTN', 'SME2', 'MTN SME2', 'MTN SME2 data plans', 5),
  ('MTN', 'CORPORATE GIFTING 2', 'MTN Corporate 2', 'MTN corporate gifting 2', 6),
  ('MTN', 'DATA SHARE', 'MTN Data Share', 'MTN data sharing plans', 7),
  ('AIRTEL', 'CORPORATE GIFTING', 'Airtel Corporate', 'Airtel corporate data plans', 1),
  ('AIRTEL', 'GIFTING', 'Airtel Gifting', 'Airtel direct gifting plans', 2),
  ('AIRTEL', 'SME', 'Airtel SME', 'Airtel SME data plans', 3),
  ('AIRTEL', 'DATA AWOOF', 'Airtel Awoof', 'Airtel data awoof plans', 4),
  ('GLO', 'GIFTING', 'Glo Gifting', 'Glo direct gifting plans', 1),
  ('GLO', 'CORPORATE GIFTING', 'Glo Corporate', 'Glo corporate data plans', 2),
  ('9MOBILE', 'GIFTING', '9mobile Gifting', '9mobile direct gifting plans', 1),
  ('9MOBILE', 'CORPORATE GIFTING', '9mobile Corporate', '9mobile corporate data plans', 2)
ON CONFLICT DO NOTHING;

-- Insert data plans with real pricing from MASKAWA API
INSERT INTO data_plans (external_id, network, plan_type, size, validity, cost_price, selling_price, profit_margin, description, is_popular, sort_order) VALUES
  -- MTN Plans
  (207, 'MTN', 'SME', '1.0 GB', '7 days', 775.0, 850.0, 75.0, 'MTN 1GB SME - 7 days', true, 1),
  (208, 'MTN', 'SME', '2.0 GB', '30 days', 1450.0, 1550.0, 100.0, 'MTN 2GB SME - 30 days', true, 2),
  (209, 'MTN', 'SME', '3.5 GB', '30 days', 2410.0, 2550.0, 140.0, 'MTN 3.5GB SME - 30 days', false, 3),
  (210, 'MTN', 'SME', '7.0 GB', '30 days', 3400.0, 3600.0, 200.0, 'MTN 7GB SME - 30 days', true, 4),
  (212, 'MTN', 'SME', '500.0 MB', '7 days', 485.0, 550.0, 65.0, 'MTN 500MB SME - 7 days', false, 5),
  (247, 'MTN', 'SME', '10.0 GB', '30 days', 4400.0, 4700.0, 300.0, 'MTN 10GB SME - 30 days', true, 6),
  
  -- MTN Corporate Gifting
  (248, 'MTN', 'CORPORATE GIFTING', '1.0 GB', '30 days', 285.0, 350.0, 65.0, 'MTN 1GB Corporate - 30 days', true, 1),
  (250, 'MTN', 'CORPORATE GIFTING', '2.0 GB', '30 days', 570.0, 650.0, 80.0, 'MTN 2GB Corporate - 30 days', true, 2),
  (266, 'MTN', 'CORPORATE GIFTING', '3.0 GB', '30 days', 855.0, 950.0, 95.0, 'MTN 3GB Corporate - 30 days', false, 3),
  (265, 'MTN', 'CORPORATE GIFTING', '5.0 GB', '30 days', 1425.0, 1550.0, 125.0, 'MTN 5GB Corporate - 30 days', true, 4),
  (211, 'MTN', 'CORPORATE GIFTING', '10.0 GB', '30 days', 2850.0, 3100.0, 250.0, 'MTN 10GB Corporate - 30 days', true, 5),
  
  -- MTN SME2
  (313, 'MTN', 'SME2', '1.0 GB', '30 days', 279.0, 350.0, 71.0, 'MTN 1GB SME2 - 30 days', true, 1),
  (314, 'MTN', 'SME2', '2.0 GB', '30 days', 558.0, 650.0, 92.0, 'MTN 2GB SME2 - 30 days', true, 2),
  (315, 'MTN', 'SME2', '3.0 GB', '30 days', 837.0, 950.0, 113.0, 'MTN 3GB SME2 - 30 days', false, 3),
  (316, 'MTN', 'SME2', '5.0 GB', '30 days', 1395.0, 1550.0, 155.0, 'MTN 5GB SME2 - 30 days', true, 4),
  (317, 'MTN', 'SME2', '10.0 GB', '30 days', 2790.0, 3100.0, 310.0, 'MTN 10GB SME2 - 30 days', true, 5),
  
  -- Airtel Plans
  (213, 'AIRTEL', 'CORPORATE GIFTING', '1.0 GB', '7 days', 790.0, 900.0, 110.0, 'Airtel 1GB Corporate - 7 days', true, 1),
  (214, 'AIRTEL', 'CORPORATE GIFTING', '2.0 GB', '30 days', 1480.0, 1650.0, 170.0, 'Airtel 2GB Corporate - 30 days', true, 2),
  (215, 'AIRTEL', 'CORPORATE GIFTING', '4.0 GB', '30 days', 2460.0, 2700.0, 240.0, 'Airtel 4GB Corporate - 30 days', false, 3),
  (216, 'AIRTEL', 'CORPORATE GIFTING', '10.0 GB', '30 days', 3960.0, 4300.0, 340.0, 'Airtel 10GB Corporate - 30 days', true, 4),
  (246, 'AIRTEL', 'CORPORATE GIFTING', '500.0 MB', '7 days', 490.0, 550.0, 60.0, 'Airtel 500MB Corporate - 7 days', false, 5),
  
  -- Airtel Gifting
  (405, 'AIRTEL', 'GIFTING', '1.0 GB', '7 days', 800.0, 900.0, 100.0, 'Airtel 1GB Gifting - 7 days', true, 1),
  (406, 'AIRTEL', 'GIFTING', '2.0 GB', '2 days', 1500.0, 1650.0, 150.0, 'Airtel 2GB Gifting - 2 days', false, 2),
  (415, 'AIRTEL', 'GIFTING', '3.0 GB', '30 days', 2000.0, 2200.0, 200.0, 'Airtel 3GB Gifting - 30 days', true, 3),
  (414, 'AIRTEL', 'GIFTING', '10.0 GB', '7 days', 4000.0, 4400.0, 400.0, 'Airtel 10GB Gifting - 7 days', true, 4),
  
  -- Glo Plans
  (232, 'GLO', 'GIFTING', '1.35 GB', '14 days', 470.0, 550.0, 80.0, 'Glo 1.35GB - 14 days (800MB day + 550MB night)', false, 1),
  (233, 'GLO', 'GIFTING', '2.9 GB', '30 days', 930.0, 1050.0, 120.0, 'Glo 2.9GB - 30 days (1.9GB day + 1GB night)', true, 2),
  (284, 'GLO', 'GIFTING', '5.8 GB', '30 days', 1850.0, 2050.0, 200.0, 'Glo 5.8GB - 30 days', true, 3),
  (285, 'GLO', 'GIFTING', '10.0 GB', '30 days', 2780.0, 3100.0, 320.0, 'Glo 10GB - 30 days', true, 4),
  (241, 'GLO', 'GIFTING', '50.0 GB', '30 days', 8100.0, 8800.0, 700.0, 'Glo 50GB - 30 days', false, 5),
  
  -- Glo Corporate
  (306, 'GLO', 'CORPORATE GIFTING', '1.0 GB', '30 days', 425.0, 500.0, 75.0, 'Glo 1GB Corporate - 30 days', true, 1),
  (307, 'GLO', 'CORPORATE GIFTING', '2.0 GB', '30 days', 850.0, 950.0, 100.0, 'Glo 2GB Corporate - 30 days', true, 2),
  (308, 'GLO', 'CORPORATE GIFTING', '3.0 GB', '30 days', 1275.0, 1400.0, 125.0, 'Glo 3GB Corporate - 30 days', false, 3),
  (309, 'GLO', 'CORPORATE GIFTING', '5.0 GB', '30 days', 2125.0, 2350.0, 225.0, 'Glo 5GB Corporate - 30 days', true, 4),
  (310, 'GLO', 'CORPORATE GIFTING', '10.0 GB', '30 days', 4250.0, 4650.0, 400.0, 'Glo 10GB Corporate - 30 days', true, 5),
  
  -- 9mobile Plans
  (227, '9MOBILE', 'GIFTING', '1.5 GB', '30 days', 810.0, 900.0, 90.0, '9mobile 1.5GB - 30 days', true, 1),
  (278, '9MOBILE', 'GIFTING', '3.0 GB', '30 days', 1250.0, 1400.0, 150.0, '9mobile 3GB - 30 days', true, 2),
  (279, '9MOBILE', 'GIFTING', '4.5 GB', '30 days', 1630.0, 1800.0, 170.0, '9mobile 4.5GB - 30 days', false, 3),
  (280, '9MOBILE', 'GIFTING', '11.0 GB', '30 days', 3150.0, 3500.0, 350.0, '9mobile 11GB - 30 days', true, 4),
  (294, '9MOBILE', 'GIFTING', '2.0 GB', '30 days', 1000.0, 1150.0, 150.0, '9mobile 2GB Direct Gifting - 30 days', true, 5),
  
  -- 9mobile Corporate
  (335, '9MOBILE', 'CORPORATE GIFTING', '1.0 GB', '30 days', 285.0, 350.0, 65.0, '9mobile 1GB Corporate - 30 days', true, 1),
  (336, '9MOBILE', 'CORPORATE GIFTING', '2.0 GB', '30 days', 680.0, 750.0, 70.0, '9mobile 2GB Corporate - 30 days', true, 2),
  (337, '9MOBILE', 'CORPORATE GIFTING', '3.0 GB', '30 days', 1020.0, 1150.0, 130.0, '9mobile 3GB Corporate - 30 days', false, 3),
  (338, '9MOBILE', 'CORPORATE GIFTING', '5.0 GB', '30 days', 1700.0, 1900.0, 200.0, '9mobile 5GB Corporate - 30 days', true, 4),
  (339, '9MOBILE', 'CORPORATE GIFTING', '10.0 GB', '30 days', 3400.0, 3750.0, 350.0, '9mobile 10GB Corporate - 30 days', true, 5)
ON CONFLICT (external_id) DO NOTHING;

-- Add admin setting for global profit margin
INSERT INTO admin_settings (key, value, description) VALUES
  ('data_plan_profit_margin', '15', 'Default profit margin percentage for data plans')
ON CONFLICT (key) DO NOTHING;