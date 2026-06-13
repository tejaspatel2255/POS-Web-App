import { supabase } from '../utils/supabaseClient';
import {
  getAllPendingOrders,
  deletePendingOrder,
  updatePendingOrderError,
  logSync,
} from './offlineDB';

let isSyncing = false;

export async function syncPendingOrders() {
  if (isSyncing) {
    return { synced: 0, failed: 0, errors: ['Sync already in progress'] };
  }

  isSyncing = true;
  const result = { synced: 0, failed: 0, errors: [] };

  try {
    const pendingOrders = await getAllPendingOrders();

    if (pendingOrders.length === 0) {
      return result;
    }

    console.log(`[SyncEngine] Found ${pendingOrders.length} orders to sync`);

    for (const order of pendingOrders) {
      if (!navigator.onLine) {
        console.log('[SyncEngine] Network connection lost during sync, aborting remaining sync tasks.');
        break;
      }
      try {
        if (order.sync_attempts >= 5) {
          result.failed++;
          result.errors.push(`Order ${order.local_id} exceeded max retry attempts`);
          continue;
        }

        // 1. Save order to Supabase
        const { data: serverOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: order.customer_id,
            cashier_id: order.cashier_id,
            subtotal: Number(order.subtotal),
            discount_amount: Number(order.discount_amount),
            tax_amount: Number(order.tax_amount),
            total: Number(order.total),
            status: 'completed',
            payment_status: 'paid',
            payments: order.payments,
            discounts: order.discounts || [],
            taxes: order.taxes || [],
            items: order.items,
            outlet_id: order.store_id || order.outlet_id,
            source: 'offline',
            local_id: order.local_id,
            created_at: order.created_at,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 2. Deduct inventory quantities
        for (const item of order.items) {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
          if (prod) {
            const newStock = Math.max(0, Number(prod.stock) - Number(item.quantity));
            await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);

            await supabase.from('inventory_logs').insert({
              product_id: item.product_id,
              type: 'out',
              quantity: -Number(item.quantity),
              reason: `Offline Sale Order #${serverOrder.id.substring(0, 8)}`,
              performed_by: order.cashier_id,
              outlet_id: order.store_id || order.outlet_id,
              created_at: order.created_at
            });
          }
        }

        // 3. Update customer points
        if (order.customer_id) {
          const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', order.customer_id).single();
          if (cust) {
            const { data: sett } = await supabase
              .from('settings')
              .select('loyalty_earn_rate')
              .eq('outlet_id', order.store_id || order.outlet_id)
              .maybeSingle();
            const earnRate = sett ? Number(sett.loyalty_earn_rate) : 1;
            const pointsEarned = Math.floor(Number(order.total) * earnRate);
            const pointsRedeemed = Number(order.redeemedPoints || 0);

            const nextPoints = Math.max(0, Number(cust.loyalty_points) + pointsEarned - pointsRedeemed);
            await supabase.from('customers').update({ loyalty_points: nextPoints }).eq('id', order.customer_id);
          }
        }

        // SUCCESS — remove from local queue
        await deletePendingOrder(order.local_id);

        // Log the sync
        await logSync({
          local_id: order.local_id,
          synced_at: new Date().toISOString(),
          server_order_id: serverOrder.id,
          success: true,
        });

        result.synced++;
        console.log(`[SyncEngine] ✓ Synced order ${order.local_id} → ${serverOrder.id}`);

      } catch (err) {
        const errorMessage = err?.message || 'Unknown error';
        await updatePendingOrderError(order.local_id, errorMessage);
        
        await logSync({
          local_id: order.local_id,
          synced_at: new Date().toISOString(),
          server_order_id: '',
          success: false,
          error: errorMessage,
        });

        result.failed++;
        result.errors.push(`Order ${order.local_id}: ${errorMessage}`);
        console.error(`[SyncEngine] ✗ Failed to sync ${order.local_id}:`, err);
      }
    }

  } finally {
    isSyncing = false;
  }

  return result;
}
