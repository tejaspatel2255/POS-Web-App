// File Path: d:/Projects/Web/Universal POS/src/lib/syncEngine.ts

import { supabase } from '@/lib/supabaseClient'
import { getPendingOrders, deletePendingOrder } from './offlineDb'

/**
 * Sends all pending orders stored in IndexedDB to Supabase.
 * On success, each order is removed from the local store.
 * Errors are logged and the order remains for next sync attempt.
 */
export async function syncPendingOrders(): Promise<void> {
  try {
    const pendingOrders = await getPendingOrders()
    if (!pendingOrders.length) return

    for (const order of pendingOrders) {
      try {
        // Insert order record (excluding items which will be linked via order_id)
        const { data: insertedOrder, error: orderError } = await (supabase
          .from('orders') as any)
          .insert({
            store_id: order.store_id,
            cashier_id: order.cashier_id,
            order_type: order.order_type,
            status: order.status,
            payment_method: order.payment_method,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            subtotal: order.subtotal,
            discount_percent: order.discount_percent,
            discount_amount: order.discount_amount,
            parcel_charges: order.parcel_charges,
            tax_amount: order.tax_amount,
            total: order.total,
            note: order.note,
            created_at: order.created_at,
          })
          .select()
          .single()

        if (orderError) throw orderError
        if (!insertedOrder) throw new Error('Failed to insert order')

        // Insert order items using the newly generated order.id
        const itemsPayload = order.items.map((item) => ({
          order_id: insertedOrder.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          line_total: item.line_total,
        }))

        const { error: itemsError } = await (supabase.from('order_items') as any).insert(itemsPayload)
        if (itemsError) throw itemsError

        // Remove from local queue after successful sync
        await deletePendingOrder(order.localId)
      } catch (innerErr) {
        console.error(`Failed to sync order ${order.localId}:`, innerErr)
        // Continue with next order; leave this one for future attempts
      }
    }
  } catch (err) {
    console.error('Sync engine encountered an error:', err)
  }
}

/**
 * Starts the background sync engine.
 * It calls syncPendingOrders() immediately then registers an online event listener.
 */
export function startSyncEngine() {
  // Initial sync attempt on page load
  syncPendingOrders()

  const handleOnline = () => {
    console.log('🔌 Back online — attempting to sync pending orders')
    syncPendingOrders()
  }

  window.addEventListener('online', handleOnline)

  // Return a cleanup function that can be used by React useEffect if needed
  return () => {
    window.removeEventListener('online', handleOnline)
  }
}
