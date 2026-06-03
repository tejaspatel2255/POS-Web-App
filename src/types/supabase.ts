// File Path: d:/Projects/Web/Universal POS/src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string
          name: string
          tagline: string | null
          logo_url: string | null
          address: string | null
          phone: string | null
          email: string | null
          currency_symbol: string
          currency_code: string
          tax_rate: number
          default_parcel_charges: number
          receipt_footer: string
          theme_color: string
          store_type: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          tagline?: string | null
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          currency_symbol?: string
          currency_code?: string
          tax_rate?: number
          default_parcel_charges?: number
          receipt_footer?: string
          theme_color?: string
          store_type?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          tagline?: string | null
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          currency_symbol?: string
          currency_code?: string
          tax_rate?: number
          default_parcel_charges?: number
          receipt_footer?: string
          theme_color?: string
          store_type?: string
          is_active?: boolean
          created_at?: string
        }
      }
      store_members: {
        Row: {
          id: string
          store_id: string
          user_id: string
          role: 'owner' | 'admin' | 'cashier'
          full_name: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'cashier'
          full_name?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'cashier'
          full_name?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          store_id: string
          name: string
          color: string
          icon: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          color?: string
          icon?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          color?: string
          icon?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string | null
          name: string
          description: string | null
          price: number
          cost_price: number
          image_url: string | null
          barcode: string | null
          unit: string
          is_available: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          category_id?: string | null
          name: string
          description?: string | null
          price?: number
          cost_price?: number
          image_url?: string | null
          barcode?: string | null
          unit?: string
          is_available?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          price?: number
          cost_price?: number
          image_url?: string | null
          barcode?: string | null
          unit?: string
          is_available?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          store_id: string
          cashier_id: string | null
          order_number: number | null
          order_type: 'dine_in' | 'takeaway' | 'delivery' | 'parcel' | 'walk_in'
          status: 'pending' | 'completed' | 'cancelled' | 'on_hold'
          payment_method: 'cash' | 'card' | 'upi' | 'other'
          customer_name: string | null
          customer_phone: string | null
          subtotal: number
          discount_percent: number
          discount_amount: number
          parcel_charges: number
          tax_amount: number
          total: number
          note: string | null
          is_synced: boolean
          scheduled_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          store_id: string
          cashier_id?: string | null
          order_number?: number | null
          order_type?: 'dine_in' | 'takeaway' | 'delivery' | 'parcel' | 'walk_in'
          status?: 'pending' | 'completed' | 'cancelled' | 'on_hold'
          payment_method?: 'cash' | 'card' | 'upi' | 'other'
          customer_name?: string | null
          customer_phone?: string | null
          subtotal?: number
          discount_percent?: number
          discount_amount?: number
          parcel_charges?: number
          tax_amount?: number
          total?: number
          note?: string | null
          is_synced?: boolean
          scheduled_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          cashier_id?: string | null
          order_number?: number | null
          order_type?: 'dine_in' | 'takeaway' | 'delivery' | 'parcel' | 'walk_in'
          status?: 'pending' | 'completed' | 'cancelled' | 'on_hold'
          payment_method?: 'cash' | 'card' | 'upi' | 'other'
          customer_name?: string | null
          customer_phone?: string | null
          subtotal?: number
          discount_percent?: number
          discount_amount?: number
          parcel_charges?: number
          tax_amount?: number
          total?: number
          note?: string | null
          is_synced?: boolean
          scheduled_at?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          discount_percent: number
          line_total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price?: number
          discount_percent?: number
          line_total?: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          discount_percent?: number
          line_total?: number
          created_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          store_id: string
          key: string
          value: string | null
        }
        Insert: {
          id?: string
          store_id: string
          key: string
          value?: string | null
        }
        Update: {
          id?: string
          store_id?: string
          key?: string
          value?: string | null
        }
      }
    }
  }
}
