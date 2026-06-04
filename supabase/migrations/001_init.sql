-- supabase/migrations/001_init.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STORES
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tagline TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  tax_rate NUMERIC DEFAULT 0,
  default_parcel_charges NUMERIC DEFAULT 0,
  receipt_footer TEXT DEFAULT 'Thank you for visiting!',
  theme_color TEXT DEFAULT '#0f766e',
  store_type TEXT DEFAULT 'retail',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STORE MEMBERS
CREATE TABLE IF NOT EXISTS store_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','cashier')) DEFAULT 'cashier',
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, user_id)
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0f766e',
  icon TEXT DEFAULT '📦',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost_price NUMERIC DEFAULT 0,
  image_url TEXT,
  unit TEXT DEFAULT 'pc',
  is_available BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT,
  order_number SERIAL,
  order_type TEXT DEFAULT 'walk_in' CHECK (order_type IN ('walk_in','dine_in','takeaway','parcel','delivery')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled','on_hold')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','card','upi','other')),
  customer_name TEXT,
  customer_phone TEXT,
  subtotal NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  parcel_charges NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  note TEXT,
  is_synced BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  line_total NUMERIC NOT NULL DEFAULT 0
);

-- STORE SETTINGS
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  UNIQUE(store_id, key)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_store_members_user_id ON store_members(user_id);
CREATE INDEX IF NOT EXISTS idx_store_members_store_id ON store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ENABLE RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTION
CREATE OR REPLACE FUNCTION get_my_role(p_store_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM store_members
  WHERE store_id = p_store_id AND user_id = auth.uid() AND is_active = true
  LIMIT 1;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- RLS: STORES
DROP POLICY IF EXISTS "stores_insert" ON stores;
CREATE POLICY "stores_insert" ON stores FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "stores_select" ON stores;
CREATE POLICY "stores_select" ON stores FOR SELECT TO authenticated
  USING (
    id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid() AND is_active = true)
    OR
    NOT EXISTS (SELECT 1 FROM store_members WHERE store_id = id)
  );

DROP POLICY IF EXISTS "stores_update" ON stores;
CREATE POLICY "stores_update" ON stores FOR UPDATE TO authenticated
  USING (get_my_role(id) IN ('owner'));

-- RLS: STORE_MEMBERS
DROP POLICY IF EXISTS "members_insert_self" ON store_members;
CREATE POLICY "members_insert_self" ON store_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "members_select" ON store_members;
CREATE POLICY "members_select" ON store_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR get_my_role(store_id) IN ('owner','admin'));

DROP POLICY IF EXISTS "members_update" ON store_members;
CREATE POLICY "members_update" ON store_members FOR UPDATE TO authenticated
  USING (get_my_role(store_id) = 'owner');

DROP POLICY IF EXISTS "members_delete" ON store_members;
CREATE POLICY "members_delete" ON store_members FOR DELETE TO authenticated
  USING (get_my_role(store_id) = 'owner');

-- RLS: CATEGORIES
DROP POLICY IF EXISTS "categories_select" ON categories;
CREATE POLICY "categories_select" ON categories FOR SELECT TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin','cashier'));

DROP POLICY IF EXISTS "categories_insert" ON categories;
CREATE POLICY "categories_insert" ON categories FOR INSERT TO authenticated
  WITH CHECK (get_my_role(store_id) IN ('owner','admin'));

DROP POLICY IF EXISTS "categories_update" ON categories;
CREATE POLICY "categories_update" ON categories FOR UPDATE TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin'));

DROP POLICY IF EXISTS "categories_delete" ON categories;
CREATE POLICY "categories_delete" ON categories FOR DELETE TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin'));

-- RLS: PRODUCTS
DROP POLICY IF EXISTS "products_select" ON products;
CREATE POLICY "products_select" ON products FOR SELECT TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin','cashier'));

DROP POLICY IF EXISTS "products_insert" ON products;
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated
  WITH CHECK (get_my_role(store_id) IN ('owner','admin'));

DROP POLICY IF EXISTS "products_update" ON products;
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin'));

DROP POLICY IF EXISTS "products_delete" ON products;
CREATE POLICY "products_delete" ON products FOR DELETE TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin'));

-- RLS: ORDERS
DROP POLICY IF EXISTS "orders_select" ON orders;
CREATE POLICY "orders_select" ON orders FOR SELECT TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin')
    OR (get_my_role(store_id) = 'cashier' AND cashier_id = auth.uid()));

DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated
  WITH CHECK (get_my_role(store_id) IN ('owner','admin','cashier'));

DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin'));

-- RLS: ORDER ITEMS
DROP POLICY IF EXISTS "order_items_select" ON order_items;
CREATE POLICY "order_items_select" ON order_items FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM orders WHERE get_my_role(store_id) IN ('owner','admin')
    OR (cashier_id = auth.uid())));

DROP POLICY IF EXISTS "order_items_insert" ON order_items;
CREATE POLICY "order_items_insert" ON order_items FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS: STORE SETTINGS
DROP POLICY IF EXISTS "settings_select" ON store_settings;
CREATE POLICY "settings_select" ON store_settings FOR SELECT TO authenticated
  USING (get_my_role(store_id) IN ('owner','admin','cashier'));

DROP POLICY IF EXISTS "settings_insert" ON store_settings;
CREATE POLICY "settings_insert" ON store_settings FOR INSERT TO authenticated
  WITH CHECK (get_my_role(store_id) = 'owner');

DROP POLICY IF EXISTS "settings_update" ON store_settings;
CREATE POLICY "settings_update" ON store_settings FOR UPDATE TO authenticated
  USING (get_my_role(store_id) = 'owner');
