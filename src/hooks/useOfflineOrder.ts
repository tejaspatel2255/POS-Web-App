// src/hooks/useOfflineOrder.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { savePendingOrder, getPendingOrders } from '../lib/offlineDb'
import { toast } from '../components/shared/Toast'

export function useOfflineOrder(storeId: string | undefined) {
  const [pendingCount, setPendingCount] = useState(0)

  const updatePendingCount = async () => {
    if (!storeId) return
    try {
      const orders = await getPendingOrders()
      setPendingCount(orders.length)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    updatePendingCount()
    
    // Listen to connection or database changes
    window.addEventListener('online', updatePendingCount)
    window.addEventListener('orders-synced', updatePendingCount)
    window.addEventListener('offline-order-saved', updatePendingCount)

    return () => {
      window.removeEventListener('online', updatePendingCount)
      window.removeEventListener('orders-synced', updatePendingCount)
      window.removeEventListener('offline-order-saved', updatePendingCount)
    }
  }, [storeId])

  const submitOrder = async (orderData: {
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

    const localId = crypto.randomUUID()
    const orderWithMeta = {
      ...orderData,
      id: localId,
      localId,
      store_id: storeId,
      is_synced: false,
      created_at: new Date().toISOString()
    }

    if (navigator.onLine) {
      try {
        const { items, localId: lId, ...orderFields } = orderWithMeta

        // 1. Insert order into Supabase
        const { error: orderErr } = await supabase
          .from('orders')
          .insert([{ ...orderFields, is_synced: true }])

        if (orderErr) throw orderErr

        // 2. Insert order items into Supabase
        if (items && items.length > 0) {
          const itemsToInsert = items.map((item: any) => ({
            order_id: localId,
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
            // Roll back the order if items failed
            await supabase.from('orders').delete().eq('id', localId)
            throw itemsErr
          }
        }

        toast.success('Order completed!')
        return { success: true, online: true, orderId: localId }
      } catch (err) {
        console.warn('Supabase insertion failed. Saving order offline...', err)
        await savePendingOrder(orderWithMeta)
        window.dispatchEvent(new Event('offline-order-saved'))
        toast.warning('Saved offline due to network issue')
        return { success: true, online: false, orderId: localId }
      }
    } else {
      // Offline mode
      await savePendingOrder(orderWithMeta)
      window.dispatchEvent(new Event('offline-order-saved'))
      toast.warning('Order saved offline')
      return { success: true, online: false, orderId: localId }
    }
  }

  return { submitOrder, pendingCount }
}
