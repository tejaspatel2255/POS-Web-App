import { savePendingOrder } from './offlineDB';
import { useOfflineStore } from '../store/offlineStore';
import { supabase } from '../utils/supabaseClient';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Safe fallback for insecure HTTP contexts on mobile
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export async function createOrder(payload, user, outletId) {
  const localId = generateUUID();
  const now = new Date().toISOString();

  // If online, save directly to Supabase via standard schema insert
  if (navigator.onLine) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: payload.customer_id,
          cashier_id: user.id,
          subtotal: Number(payload.subtotal),
          discount_amount: Number(payload.discount_amount),
          tax_amount: Number(payload.tax_amount),
          total: Number(payload.total),
          status: 'completed',
          payment_status: 'paid',
          payments: payload.payments,
          discounts: payload.discounts || [],
          taxes: payload.taxes || [],
          items: payload.items,
          outlet_id: outletId,
          source: 'online',
          local_id: localId,
          created_at: now
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct inventory quantities
      for (const item of payload.items) {
        const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
        if (prod) {
          const newStock = Math.max(0, Number(prod.stock) - Number(item.quantity));
          await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);

          await supabase.from('inventory_logs').insert({
            product_id: item.product_id,
            type: 'out',
            quantity: -Number(item.quantity),
            reason: `Sale Order #${data.id.substring(0, 8)}`,
            performed_by: user.id,
            outlet_id: outletId
          });
        }
      }

      // Update customer points
      if (payload.customer_id) {
        const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', payload.customer_id).single();
        if (cust) {
          const { data: sett } = await supabase.from('settings').select('loyalty_earn_rate').eq('outlet_id', outletId).maybeSingle();
          const earnRate = sett ? Number(sett.loyalty_earn_rate) : 1;
          const pointsEarned = Math.floor(Number(payload.total) * earnRate);
          const pointsRedeemed = Number(payload.redeemedPoints || 0);

          const nextPoints = Math.max(0, Number(cust.loyalty_points) + pointsEarned - pointsRedeemed);
          await supabase.from('customers').update({ loyalty_points: nextPoints }).eq('id', payload.customer_id);
        }
      }

      return { success: true, offline: false, order: data };
    } catch (err) {
      console.warn('[createOrder] Online save failed, saving offline:', err);
    }
  }

  // Save to IndexedDB
  try {
    const offlineOrder = {
      local_id: localId,
      store_id: outletId,
      cashier_id: user.id,
      items: payload.items,
      subtotal: Number(payload.subtotal),
      discount_amount: Number(payload.discount_amount),
      tax_amount: Number(payload.tax_amount),
      total: Number(payload.total),
      payments: payload.payments,
      discounts: payload.discounts || [],
      taxes: payload.taxes || [],
      status: 'pending_sync',
      created_at: now,
      sync_attempts: 0,
      redeemedPoints: payload.redeemedPoints || 0,
      customer_id: payload.customer_id
    };

    await savePendingOrder(offlineOrder);

    // Refresh pending count
    await useOfflineStore.getState().refreshPendingCount();

    return { success: true, offline: true, order: { ...offlineOrder, id: localId, _id: localId, created_at: now } };
  } catch (err) {
    return { success: false, offline: true, error: err.message };
  }
}
