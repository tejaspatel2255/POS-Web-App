-- File Path: d:/Projects/Web/Universal POS/supabase/001_universal_pos.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Safely drop old single-tenant tables and functions
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS get_user_store_role CASCADE;
DROP FUNCTION IF EXISTS store_has_members CASCADE;
DROP FUNCTION IF EXISTS get_user_order_role CASCADE;

-- 1. Create stores table
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tagline text,
  logo_url text,
  address text,
  phone text,
  email text,
  currency_symbol text DEFAULT '₹',
  currency_code text DEFAULT 'INR',
  tax_rate numeric DEFAULT 0,
  default_parcel_charges numeric DEFAULT 0,
  receipt_footer text DEFAULT 'Thank you for your visit!',
  theme_color text DEFAULT '#0f766e',
  store_type text DEFAULT 'retail',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Create store_members table
CREATE TABLE store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner','admin','cashier')) DEFAULT 'cashier',
  full_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- 3. Create categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#0f766e',
  icon text DEFAULT '📦',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Create products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  cost_price numeric DEFAULT 0,
  image_url text,
  barcode text,
  unit text DEFAULT 'pc',
  is_available boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  cashier_id uuid REFERENCES auth.users(id),
  order_number int,
  order_type text CHECK (order_type IN ('dine_in','takeaway','delivery','parcel','walk_in')) DEFAULT 'walk_in',
  status text CHECK (status IN ('pending','completed','cancelled','on_hold')) DEFAULT 'pending',
  payment_method text CHECK (payment_method IN ('cash','card','upi','other')) DEFAULT 'cash',
  customer_name text,
  customer_phone text,
  subtotal numeric DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  parcel_charges numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total numeric DEFAULT 0,
  note text,
  is_synced boolean DEFAULT true,
  scheduled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 6. Create order_items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity numeric DEFAULT 1,
  unit_price numeric DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  line_total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 7. Create store_settings table
CREATE TABLE store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  UNIQUE(store_id, key)
);

-- Helper function to check role of current user in a store
CREATE OR REPLACE FUNCTION public.get_user_store_role(p_store_id uuid)
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.store_members
  WHERE store_id = p_store_id AND user_id = auth.uid() AND is_active = true;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check if store has members (used for bootstrapping owners)
CREATE OR REPLACE FUNCTION public.store_has_members(p_store_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.store_members WHERE store_id = p_store_id AND user_id != auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper function to check role of current user in the store related to an order
CREATE OR REPLACE FUNCTION public.get_user_order_role(p_order_id uuid)
RETURNS text AS $$
DECLARE
  v_store_id uuid;
BEGIN
  SELECT store_id INTO v_store_id
  FROM public.orders
  WHERE id = p_order_id;
  
  IF v_store_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN public.get_user_store_role(v_store_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- Enable Row Level Security (RLS) on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;


-- RLS Policies for STORES
CREATE POLICY "Allow members to view store" ON stores
  FOR SELECT TO authenticated
  USING (
    get_user_store_role(id) IS NOT NULL
    OR
    NOT public.store_has_members(id)
  );

CREATE POLICY "Allow members to update store" ON stores
  FOR UPDATE TO authenticated
  USING (
    get_user_store_role(id) IS NOT NULL
  )
  WITH CHECK (
    get_user_store_role(id) IS NOT NULL
  );

CREATE POLICY "Allow authenticated to insert store" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (true);


-- RLS Policies for STORE_MEMBERS
CREATE POLICY "Allow store members to view store members" ON store_members
  FOR SELECT TO authenticated
  USING (
    get_user_store_role(store_id) IS NOT NULL
  );

CREATE POLICY "Allow owners to insert store members" ON store_members
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_store_role(store_id) = 'owner'
    OR
    (
      NOT public.store_has_members(store_id)
      AND user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Allow owners to update store members" ON store_members
  FOR UPDATE TO authenticated
  USING (
    get_user_store_role(store_id) = 'owner'
  )
  WITH CHECK (
    get_user_store_role(store_id) = 'owner'
  );

CREATE POLICY "Allow owners to delete store members" ON store_members
  FOR DELETE TO authenticated
  USING (
    get_user_store_role(store_id) = 'owner'
  );


-- RLS Policies for CATEGORIES
CREATE POLICY "Allow members to view categories" ON categories
  FOR SELECT TO authenticated
  USING (
    get_user_store_role(store_id) IS NOT NULL
  );

CREATE POLICY "Allow owners/admins to insert categories" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_store_role(store_id) IN ('owner', 'admin')
  );

CREATE POLICY "Allow owners/admins to update categories" ON categories
  FOR UPDATE TO authenticated
  USING (
    get_user_store_role(store_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_store_role(store_id) IN ('owner', 'admin')
  );

CREATE POLICY "Allow owners/admins to delete categories" ON categories
  FOR DELETE TO authenticated
  USING (
    get_user_store_role(store_id) IN ('owner', 'admin')
  );


-- RLS Policies for PRODUCTS
CREATE POLICY "Allow members to view products" ON products
  FOR SELECT TO authenticated
  USING (
    get_user_store_role(store_id) IS NOT NULL
  );

CREATE POLICY "Allow owners/admins to insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_store_role(store_id) IN ('owner', 'admin')
  );

CREATE POLICY "Allow owners/admins to update products" ON products
  FOR UPDATE TO authenticated
  USING (
    get_user_store_role(store_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_store_role(store_id) IN ('owner', 'admin')
  );

CREATE POLICY "Allow owners/admins to delete products" ON products
  FOR DELETE TO authenticated
  USING (
    get_user_store_role(store_id) IN ('owner', 'admin')
  );


-- RLS Policies for ORDERS
CREATE POLICY "Allow store members to view orders" ON orders
  FOR SELECT TO authenticated
  USING (
    get_user_store_role(store_id) IN ('owner', 'admin')
    OR
    (
      get_user_store_role(store_id) = 'cashier'
      AND cashier_id = auth.uid()
    )
  );

CREATE POLICY "Allow members to insert orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_store_role(store_id) IS NOT NULL
  );

CREATE POLICY "Allow owners/admins to update orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    get_user_store_role(store_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_store_role(store_id) IN ('owner', 'admin')
  );


-- RLS Policies for ORDER_ITEMS
CREATE POLICY "Allow store members to view order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    get_user_order_role(order_id) IN ('owner', 'admin')
    OR
    (
      get_user_order_role(order_id) = 'cashier'
      AND EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = order_items.order_id AND cashier_id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow members to insert order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_order_role(order_id) IS NOT NULL
  );

CREATE POLICY "Allow owners/admins to update order items" ON order_items
  FOR UPDATE TO authenticated
  USING (
    get_user_order_role(order_id) IN ('owner', 'admin')
  )
  WITH CHECK (
    get_user_order_role(order_id) IN ('owner', 'admin')
  );


-- RLS Policies for STORE_SETTINGS
CREATE POLICY "Allow members to view store settings" ON store_settings
  FOR SELECT TO authenticated
  USING (
    get_user_store_role(store_id) IS NOT NULL
  );

CREATE POLICY "Allow owners to insert store settings" ON store_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_store_role(store_id) = 'owner'
  );

CREATE POLICY "Allow owners to update store settings" ON store_settings
  FOR UPDATE TO authenticated
  USING (
    get_user_store_role(store_id) = 'owner'
  )
  WITH CHECK (
    get_user_store_role(store_id) = 'owner'
  );


-- Performance Indexes for Foreign Keys and Query Filtering
CREATE INDEX IF NOT EXISTS idx_store_members_store_id ON store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user_id ON store_members(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_cashier_id ON orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_store_settings_store_id ON store_settings(store_id);
