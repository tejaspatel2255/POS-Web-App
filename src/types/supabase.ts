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
      categories: {
        Row: {
          id: string
          name: string
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number | null
          created_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          price: number | null
          image_url: string | null
          is_available: boolean | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          price?: number | null
          image_url?: string | null
          is_available?: boolean | null
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          price?: number | null
          image_url?: string | null
          is_available?: boolean | null
          sort_order?: number | null
          created_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          cashier_id: string | null
          order_type: string
          status: string
          payment_method: string | null
          subtotal: number
          discount_percent: number | null
          discount_amount: number | null
          tax: number | null
          parcel_charges: number | null
          total: number
          note: string | null
          scheduled_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          cashier_id?: string | null
          order_type: string
          status: string
          payment_method?: string | null
          subtotal: number
          discount_percent?: number | null
          discount_amount?: number | null
          tax?: number | null
          parcel_charges?: number | null
          total: number
          note?: string | null
          scheduled_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          cashier_id?: string | null
          order_type?: string
          status?: string
          payment_method?: string | null
          subtotal?: number
          discount_percent?: number | null
          discount_amount?: number | null
          tax?: number | null
          parcel_charges?: number | null
          total?: number
          note?: string | null
          scheduled_at?: string | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'cashier'
          full_name: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          role: 'admin' | 'cashier'
          full_name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          role?: 'admin' | 'cashier'
          full_name?: string | null
          created_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
          line_total: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price: number
          line_total: number
        }
        Update: {
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
          line_total?: number
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          value?: Json
        }
      }
    }
  }
}
