import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Database } from '../types/supabase'

type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']

export function useOrders(dateRange?: { start: string; end: string }, status?: string) {
  return useQuery<any[]>({
    queryKey: ['orders', dateRange, status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      
      if (dateRange) {
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end)
      }
      if (status) {
        query = query.eq('status', status)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

import { queueOfflineOrder } from './useOfflineSync'

export function useCreateOrder() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ order, items }: { order: OrderInsert; items: Omit<OrderItemInsert, 'order_id'>[] }) => {
      if (!navigator.onLine) {
        const offlineId = 'offline-' + crypto.randomUUID()
        queueOfflineOrder(order, items)
        return { id: offlineId, offline: true } as any
      }

      // 1. Create order
      const { data: newOrder, error: orderError } = await (supabase
        .from('orders')
        .insert(order as any)
        .select()
        .single() as any)
      
      if (orderError) throw orderError
      
      // 2. Create items
      const itemsWithOrderId = items.map(item => ({
        ...item,
        order_id: newOrder.id
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsWithOrderId as any)
        
      if (itemsError) throw itemsError
      
      return newOrder
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}
