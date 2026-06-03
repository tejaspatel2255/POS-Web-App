// File Path: d:/Projects/Web/Universal POS/src/hooks/useOfflineOrder.ts

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { savePendingOrder, deletePendingOrder, getPendingOrderCount, getPendingOrders } from '@/lib/offlineDb'
import { useToast } from '../components/ui/use-toast'

export function useOfflineOrder() {
  const [isSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const { toast } = useToast()

  // Initialize pending count when hook loads
  useEffect(() => {
    let active = true
    const loadCount = async () => {
      const count = await getPendingOrderCount()
      if (active) {
        setPendingCount(count)
      }
    }
    loadCount()
    return () => {
      active = false
    }
  }, [])

  const submitOrder = async (orderData: any) => {
    if (navigator.onLine) {
      try {
        // Try direct Supabase insert (order + items)
        const { order, items } = orderData
        const { data: newOrder, error: orderErr } = await (supabase
          .from('orders') as any)
          .insert(order)
          .select()
          .single()

        if (orderErr) throw orderErr
        // Insert items linked to the new order id
        const itemsWithId = items.map((i: any) => ({
          ...i,
          order_id: (newOrder as any).id,
        }))
        const { error: itemsErr } = await (supabase.from('order_items') as any).insert(itemsWithId)
        if (itemsErr) throw itemsErr

        toast({
          title: '✅ Order saved',
          description: 'Your order was recorded online.',
        })
      } catch (err) {
        console.warn('Online insert failed, falling back to offline storage', err)
        // Fallback to offline
        await fallbackOffline(orderData)
      }
    } else {
      // Offline – save directly
      await fallbackOffline(orderData)
    }
  }

  const fallbackOffline = async (orderData: any) => {
    const localId = crypto.randomUUID()
    const pending = {
      ...orderData,
      localId,
      is_synced: false,
      created_at: new Date().toISOString(),
    }
    await savePendingOrder(pending)
    const newCount = await getPendingOrderCount()
    setPendingCount(newCount)
    toast({
      title: '⚡ Saved offline',
      description: `Your order will be synced when back online. (${newCount} pending)`,
      variant: 'default',
    })
  }

  const clearSynced = async () => {
    // Purge any orders that have been synced (unlikely they remain after syncEngine)
    const pending = await getPendingOrders()
    for (const po of pending) {
      if (po.is_synced) await deletePendingOrder(po.localId)
    }
    setPendingCount(await getPendingOrderCount())
  }

  return { submitOrder, isSyncing, pendingCount, clearSynced }
}
