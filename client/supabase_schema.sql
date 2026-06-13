-- Savaliya Universal POS Supabase Schema Setup
-- Run this in the SQL Editor of your Supabase Dashboard

-- 1. Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE OUTLETS TABLE
CREATE TABLE public.outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    receipt_header TEXT,
    receipt_footer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. CREATE PROFILES TABLE (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. CREATE CATEGORIES TABLE
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    color TEXT DEFAULT '#94A3B8',
    sort_order INT DEFAULT 0,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. CREATE TAX RATES TABLE
CREATE TABLE public.tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    percentage NUMERIC NOT NULL DEFAULT 0,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. CREATE PRODUCTS TABLE
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    base_price NUMERIC NOT NULL DEFAULT 0,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    tax_rate_id UUID REFERENCES public.tax_rates(id) ON DELETE SET NULL,
    stock INT DEFAULT 0,
    stock_threshold INT DEFAULT 5,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    variants JSONB DEFAULT '[]'::jsonb,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. CREATE DISCOUNT TYPES TABLE
CREATE TABLE public.discount_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    default_value NUMERIC NOT NULL DEFAULT 0,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. CREATE PAYMENT METHODS TABLE
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. CREATE CUSTOMERS TABLE
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    loyalty_points INT DEFAULT 0,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. CREATE ORDERS TABLE
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'voided')),
    payment_status TEXT DEFAULT 'paid',
    payments JSONB DEFAULT '[]'::jsonb,
    discounts JSONB DEFAULT '[]'::jsonb,
    taxes JSONB DEFAULT '[]'::jsonb,
    items JSONB DEFAULT '[]'::jsonb,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. CREATE INVENTORY LOGS TABLE
CREATE TABLE public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INT NOT NULL,
    reason TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. CREATE STOCK ADJUSTMENT REASONS TABLE
CREATE TABLE public.stock_adjustment_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. CREATE SETTINGS TABLE
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    require_shift_open BOOLEAN DEFAULT false,
    loyalty_earn_rate NUMERIC DEFAULT 1,
    loyalty_redeem_rate NUMERIC DEFAULT 0.01,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. CREATE SHIFTS TABLE
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    opening_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closing_time TIMESTAMP WITH TIME ZONE,
    opening_balance NUMERIC NOT NULL DEFAULT 0,
    expected_cash NUMERIC,
    actual_cash NUMERIC,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. PROFILE TRIGGER ON USER SIGNUP
-- Automatically creates a profile record when a user registers on Supabase Auth.
-- If it's the first profile created, they are assigned the 'admin' role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_first BOOLEAN;
    default_outlet_id UUID;
BEGIN
    -- Check if this is the first profile
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first;
    
    -- If first user, create a default outlet first
    IF is_first THEN
        INSERT INTO public.outlets (name, address, phone)
        VALUES ('Primary Outlet', 'Default Address', '123-456-7890')
        RETURNING id INTO default_outlet_id;
        
        INSERT INTO public.profiles (id, name, email, role, outlet_id)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'name', 'Administrator'),
            new.email,
            'admin',
            default_outlet_id
        );
        
        -- Seed initial records for the new outlet
        INSERT INTO public.settings (require_shift_open, loyalty_earn_rate, loyalty_redeem_rate, outlet_id)
        VALUES (false, 1, 0.01, default_outlet_id);
        
        INSERT INTO public.payment_methods (name, enabled, outlet_id)
        VALUES 
            ('Cash', true, default_outlet_id),
            ('Card', true, default_outlet_id),
            ('UPI', true, default_outlet_id);
            
        INSERT INTO public.stock_adjustment_reasons (name, outlet_id)
        VALUES 
            ('Restock', default_outlet_id),
            ('Damaged', default_outlet_id),
            ('Theft', default_outlet_id),
            ('Discrepancy', default_outlet_id);
            
        INSERT INTO public.tax_rates (name, percentage, outlet_id)
        VALUES ('Exempt / Zero Tax', 0, default_outlet_id);
    ELSE
        -- Standard user (cashier) without initial outlet attachment
        INSERT INTO public.profiles (id, name, email, role, outlet_id)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'name', 'Cashier User'),
            new.email,
            'cashier',
            NULL
        );
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
