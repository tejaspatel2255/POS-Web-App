// src/lib/syncEngine.ts
import { supabase } from './supabase'
import { getPendingOrders, deletePendingOrder } from './offlineDb'

export async function syncPendingOrders(): Promise<void> {
  if (!navigator.onLine) return
  
  const pending = await getPendingOrders()
  if (pending.length === 0) return

  console.log(`Syncing ${pending.length} pending orders to Supabase...`)

  for (const p of pending) {
    try {
      const { items, localId, ...orderData } = p

      // Ensure id matches orderData
      const orderId = orderData.id || crypto.randomUUID()
      const cleanOrder = {
        ...orderData,
        id: orderId,
        is_synced: true
      }

      // 1. Insert order
      const { error: orderErr } = await supabase
        .from('orders')
        .insert([cleanOrder])

      if (orderErr) throw orderErr

      // 2. Insert order items
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          order_id: orderId,
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
          // If items fail, clean up order in Supabase or handle
          await supabase.from('orders').delete().eq('id', orderId)
          throw itemsErr
        }
      }

      // 3. Delete from IndexedDB on complete success
      await deletePendingOrder(localId)
      console.log(`Successfully synced offline order: ${localId}`)
    } catch (err) {
      console.error(`Failed to sync offline order:`, err)
    }
  }

  // Trigger global custom event for components to reload data
  window.dispatchEvent(new Event('orders-synced'))
}

export function startSyncEngine(): void {
  // Sync on startup
  if (navigator.onLine) {
    syncPendingOrders()
  }

  // Listen to window online status change
  window.addEventListener('online', () => {
    syncPendingOrders()
  })
}
