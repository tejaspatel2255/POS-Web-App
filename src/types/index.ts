// src/types/index.ts

export type UserRole = 'owner' | 'admin' | 'cashier';

export interface Store {
  id: string;
  name: string;
  tagline?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  currency_symbol: string;
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
  full_name: string;
  is_active: boolean;
  created_at: string;
  stores?: Store; // Joined store details
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
  category_id?: string | null;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  image_url?: string;
  unit: string;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  cashier_id?: string;
  cashier_name?: string;
  order_number: number;
  order_type: 'walk_in' | 'dine_in' | 'takeaway' | 'parcel' | 'delivery';
  status: 'pending' | 'completed' | 'cancelled' | 'on_hold';
  payment_method: 'cash' | 'card' | 'upi' | 'other';
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  parcel_charges: number;
  tax_amount: number;
  total: number;
  note?: string;
  is_synced: boolean;
  created_at: string;
  order_items?: OrderItem[]; // Joined order items
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
}

export interface StoreSettings {
  id: string;
  store_id: string;
  key: string;
  value: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  unit: string;
  discount_percent: number;
  image_url?: string;
}
