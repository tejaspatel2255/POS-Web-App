// File Path: d:/Projects/Web/Universal POS/src/types/index.ts

export type UserRole = 'owner' | 'admin' | 'cashier';

export interface Store {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency_symbol: string;
  currency_code: string;
  tax_rate: number;
  default_parcel_charges: number;
  receipt_footer: string;
  theme_color: string;
  store_type: string;
  is_active: boolean;
  created_at: string;
}

export interface StoreMember {
  id: string;
  store_id: string;
  user_id: string;
  role: UserRole;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  cost_price: number;
  image_url: string | null;
  barcode: string | null;
  unit: string;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  cashier_id: string | null;
  order_number: number | null;
  order_type: 'dine_in' | 'takeaway' | 'delivery' | 'parcel' | 'walk_in';
  status: 'pending' | 'completed' | 'cancelled' | 'on_hold';
  payment_method: 'cash' | 'card' | 'upi' | 'other';
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  parcel_charges: number;
  tax_amount: number;
  total: number;
  note: string | null;
  is_synced: boolean;
  scheduled_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_id: string;
  key: string;
  value: string | null;
}

export interface CartItem extends Product {
  cart_item_id: string;
  quantity: number;
  discount_percent: number;
}
