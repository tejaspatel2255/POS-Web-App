// src/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Order } from '../types'

export function useOrders(
  storeId: string | undefined,
  filters: { dateFrom?: string; dateTo?: string; status?: string; paymentMethod?: string }
) {
  return useQuery<Order[]>({
    queryKey: ['orders', storeId, filters],
    queryFn: async () => {
      if (!storeId) return []

      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      const { data, error } = await query as any
      if (error) throw error

      return data || []
    },
    enabled: !!storeId,
  })
}

export function useCreateOrder(storeId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData: {
      cashier_id?: string
      cashier_name?: string
      order_type: string
      status: string
      payment_method: string
      customer_name?: string
      customer_phone?: string
      subtotal: number
      discount_percent: number
      discount_amount: number
      parcel_charges: number
      tax_amount: number
      total: number
      note?: string
      items: any[]
    }) => {
      if (!storeId) throw new Error('No active store')

      const { items, ...orderFields } = orderData

      // 1. Insert order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([{
          ...orderFields,
          store_id: storeId,
          is_synced: true
        }])
        .select()
        .single()

      if (orderErr) throw orderErr

      // 2. Insert order items
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id || null,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.price,
          discount_percent: item.discount_percent || 0,
          line_total: Number((item.quantity * item.price * (1 - (item.discount_percent || 0) / 100)).toFixed(2))
        }))

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(itemsToInsert)

        if (itemsErr) {
          // Rollback order insert if items failed
          await supabase.from('orders').delete().eq('id', order.id)
          throw itemsErr
        }
      }

      return order as Order
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', storeId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', storeId] })
    },
  })
}

export function useDashboardStats(storeId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', storeId],
    queryFn: async () => {
      if (!storeId) return { todaySales: 0, orderCount: 0, pendingCount: 0, onHoldCount: 0 }

      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, status')
        .eq('store_id', storeId)
        .gte('created_at', startOfToday.toISOString())

      if (error) throw error

      let todaySales = 0
      let orderCount = 0
      let pendingCount = 0
      let onHoldCount = 0

      if (orders) {
        orders.forEach((o) => {
          if (o.status === 'completed') {
            todaySales += Number(o.total)
          }
          if (o.status !== 'cancelled') {
            orderCount++
          }
          if (o.status === 'pending') {
            pendingCount++
          }
          if (o.status === 'on_hold') {
            onHoldCount++
          }
        })
      }

      return {
        todaySales: Number(todaySales.toFixed(2)),
        orderCount,
        pendingCount,
        onHoldCount,
      }
    },
    enabled: !!storeId,
    refetchInterval: 30000, // Poll every 30 seconds for live updates
  })
}
