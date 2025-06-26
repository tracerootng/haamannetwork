/*
  # Add product categories table for custom categories

  1. New Tables
    - `product_categories` - Store custom product categories
      - `id` (uuid, primary key)
      - `name` (text, category name)
      - `description` (text, optional description)
      - `is_active` (boolean, default true)
      - `sort_order` (integer, for ordering)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `product_categories` table
    - Add policies for public read access
    - Add policies for admin management

  3. Indexes
    - Add index on name for fast lookups
    - Add index on is_active for filtering
*/

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read active product categories"
  ON product_categories
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage product categories"
  ON product_categories
  FOR ALL
  TO authenticated
  USING (is_admin_user());

-- Create indexes
CREATE INDEX IF NOT EXISTS product_categories_name_idx ON product_categories(name);
CREATE INDEX IF NOT EXISTS product_categories_active_idx ON product_categories(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_product_categories_updated_at 
  BEFORE UPDATE ON product_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO product_categories (name, description, sort_order) VALUES
  ('Electronics', 'Electronic devices and gadgets', 1),
  ('Mobile', 'Mobile phones and accessories', 2),
  ('Computers', 'Laptops, desktops and computer accessories', 3),
  ('Gaming', 'Gaming consoles and accessories', 4),
  ('Accessories', 'General accessories for various devices', 5)
ON CONFLICT (name) DO NOTHING;