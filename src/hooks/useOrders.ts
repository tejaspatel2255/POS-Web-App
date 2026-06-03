// File Path: d:/Projects/Web/Universal POS/src/hooks/useOrders.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Order, OrderItem } from '../types'

interface OrderFilters {
  status?: string
  orderType?: string
  paymentMethod?: string
  startDate?: string
  endDate?: string
  limit?: number
}

export function useOrders(storeId: string | null | undefined, filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', storeId, filters],
    queryFn: async () => {
      if (!storeId) return []
      let query = (supabase
        .from('orders') as any)
        .select(`
          *,
          items:order_items (
            id,
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            discount_percent,
            line_total,
            created_at
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.orderType && filters.orderType !== 'all') {
        query = query.eq('order_type', filters.orderType)
      }
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod)
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query
      if (error) throw error
      return data as (Order & { items: OrderItem[] })[]
    },
    enabled: !!storeId,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ order, items }: { order: Omit<Order, 'id' | 'created_at'>; items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[] }) => {
      // 1. Create order in Supabase
      const { data: newOrder, error: orderError } = await (supabase
        .from('orders') as any)
        .insert(order)
        .select()
        .single()

      if (orderError) throw orderError
      if (!newOrder) throw new Error('Order creation returned no data')

      // 2. Prepare items with the created order ID
      const itemsToInsert = items.map((item) => ({
        ...item,
        order_id: (newOrder as any).id,
      }))

      // 3. Create order items
      const { error: itemsError } = await (supabase
        .from('order_items') as any)
        .insert(itemsToInsert)

      if (itemsError) {
        // Attempt cleanup/rollback of order since items insert failed
        await (supabase.from('orders') as any).delete().eq('id', (newOrder as any).id)
        throw itemsError
      }

      return newOrder as Order
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders', data.store_id] })
    }
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, store_id: _store_id, status }: { id: string; store_id: string; status: Order['status'] }) => {
      const { data, error } = await (supabase
        .from('orders') as any)
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Order
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders', data.store_id] })
    }
  })
}
