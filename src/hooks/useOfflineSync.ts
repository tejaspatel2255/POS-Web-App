import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineOrders()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Run initial sync check
    if (navigator.onLine) {
      syncOfflineOrders()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncOfflineOrders = async () => {
    const queue = localStorage.getItem('offline_orders_queue')
    if (!queue) return

    const orders = JSON.parse(queue)
    if (orders.length === 0) return

    setSyncing(true)
    const failedOrders: any[] = []

    for (const item of orders) {
      try {
        const { order, items } = item

        // Create order
        const { data: newOrder, error: orderError } = await (supabase
          .from('orders')
          .insert(order)
          .select()
          .single() as any)

        if (orderError) throw orderError

        // Create items
        const itemsWithOrderId = items.map((i: any) => ({
          ...i,
          order_id: newOrder.id
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsWithOrderId)

        if (itemsError) throw itemsError
      } catch (error) {
        console.error('Failed to sync offline order:', error)
        failedOrders.push(item)
      }
    }

    if (failedOrders.length > 0) {
      localStorage.setItem('offline_orders_queue', JSON.stringify(failedOrders))
    } else {
      localStorage.removeItem('offline_orders_queue')
    }
    setSyncing(false)
  }

  return { isOnline, syncing }
}

export function queueOfflineOrder(order: any, items: any[]) {
  const queue = localStorage.getItem('offline_orders_queue')
  const orders = queue ? JSON.parse(queue) : []
  orders.push({ order, items })
  localStorage.setItem('offline_orders_queue', JSON.stringify(orders))
}
