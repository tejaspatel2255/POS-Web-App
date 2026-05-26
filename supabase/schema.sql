-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by authenticated users." ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow users to insert their own profile during signup." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles can be updated by admins." ON profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories viewable by authenticated users" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categories updatable by admins" ON categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0.00,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products viewable by authenticated users" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Products updatable by admins" ON products FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id UUID REFERENCES profiles(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('dine_in', 'takeaway', 'delivery', 'parcel')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled', 'on_hold')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'upi')),
  subtotal DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  parcel_charges DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  note TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders viewable by all authenticated users" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Orders insertable by all authenticated users" ON orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Orders updatable by admins or creator" ON orders FOR UPDATE TO authenticated USING (
  cashier_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items viewable by all authenticated users" ON order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Order items insertable by all authenticated users" ON order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Order items updatable by admins or creator" ON order_items FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND cashier_id = auth.uid()) OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SETTINGS
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by all authenticated users" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Settings updatable by admins" ON settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create initial settings
INSERT INTO settings (key, value) VALUES 
('business', '{"name": "Savaliya Ice Cream", "address": "", "phone": "", "tax_rate": 0, "parcel_charges": 0}'::jsonb)
ON CONFLICT (key) DO NOTHING;
