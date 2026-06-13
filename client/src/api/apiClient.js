import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';

// Helper to get active user details
const getActiveUser = () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Not authenticated');
  const outletId = user.outlet_id?.id || user.outlet_id || null;
  return { user, outletId };
};

// Helper to extract id from path: /api/products/123 -> 123
const extractId = (url, prefix) => {
  const path = url.replace(prefix, '');
  const parts = path.split('/');
  // Filter out empty parts or sub-routes
  return parts.find(p => p && p !== 'refund' && p !== 'void' && p !== 'stats') || null;
};

const apiClient = {
  get: async (url) => {
    try {
      const { user, outletId } = getActiveUser();

      // 1. PRODUCTS
      if (url.startsWith('/api/products')) {
        const { data, error } = await supabase
          .from('products')
          .select('*, category_id(*), tax_rate_id(*)')
          .eq('outlet_id', outletId);
        if (error) throw error;
        // Map keys to _id for React page compatibility
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 2. CATEGORIES
      if (url.startsWith('/api/categories')) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('outlet_id', outletId)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 3. CUSTOMERS
      if (url.startsWith('/api/customers')) {
        const custId = extractId(url, '/api/customers/');
        if (url.includes('/stats') && custId) {
          // Calculate loyalty and order stats
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', custId)
            .eq('status', 'completed');
          if (ordersError) throw ordersError;

          const visitCount = orders ? orders.length : 0;
          const totalSpend = orders ? orders.reduce((sum, o) => sum + Number(o.total), 0) : 0;
          const averageSpend = visitCount > 0 ? totalSpend / visitCount : 0;

          // Map order items to expected format
          const purchaseHistory = (orders || []).map(o => ({
            ...o,
            _id: o.id,
            items: Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]')
          }));

          return {
            data: {
              visitCount,
              totalSpend,
              averageSpend,
              purchaseHistory
            }
          };
        }

        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('outlet_id', outletId);
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 4. DISCOUNT TYPES
      if (url.startsWith('/api/discount-types')) {
        const { data, error } = await supabase
          .from('discount_types')
          .select('*')
          .eq('outlet_id', outletId);
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 5. TAX RATES
      if (url.startsWith('/api/tax-rates')) {
        const { data, error } = await supabase
          .from('tax_rates')
          .select('*')
          .eq('outlet_id', outletId);
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 6. PAYMENT METHODS
      if (url.startsWith('/api/payment-methods')) {
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('outlet_id', outletId);
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 7. STOCK ADJUSTMENT REASONS
      if (url.startsWith('/api/stock-adjustment-reasons')) {
        const { data, error } = await supabase
          .from('stock_adjustment_reasons')
          .select('*')
          .eq('outlet_id', outletId);
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 8. OUTLETS
      if (url.startsWith('/api/outlets')) {
        const { data, error } = await supabase
          .from('outlets')
          .select('*');
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        return { data: mapped };
      }

      // 9. USERS (STAFF)
      if (url.startsWith('/api/users')) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, outlet_id(*)')
          .eq('outlet_id', outletId);
        if (error) throw error;
        const mapped = data.map(item => ({
          ...item,
          _id: item.id,
          outlet_id: item.outlet_id ? { ...item.outlet_id, _id: item.outlet_id.id } : null
        }));
        return { data: mapped };
      }

      // 10. SETTINGS
      if (url.startsWith('/api/settings')) {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('outlet_id', outletId)
          .maybeSingle();
        if (error) throw error;
        return { data: { settings: data } };
      }

      // 11. INVENTORY
      if (url.startsWith('/api/inventory')) {
        if (url.includes('/logs')) {
          const { data, error } = await supabase
            .from('inventory_logs')
            .select('*, product_id(*), performed_by(*)')
            .eq('outlet_id', outletId)
            .order('created_at', { ascending: false });
          if (error) throw error;
          const mapped = data.map(item => ({
            ...item,
            _id: item.id,
            product_id: item.product_id ? { ...item.product_id, _id: item.product_id.id } : null,
            performed_by: item.performed_by ? { ...item.performed_by, _id: item.performed_by.id } : null
          }));
          return { data: mapped };
        } else {
          // Stock levels valuation listing
          const { data, error } = await supabase
            .from('products')
            .select('*, category_id(*)')
            .eq('outlet_id', outletId);
          if (error) throw error;
          const mapped = data.map(item => ({
            ...item,
            _id: item.id,
            category_id: item.category_id ? { ...item.category_id, _id: item.category_id.id } : null
          }));
          return { data: mapped };
        }
      }

      // 12. ORDERS
      if (url.startsWith('/api/orders')) {
        const { data, error } = await supabase
          .from('orders')
          .select('*, customer_id(*), cashier_id(*)')
          .eq('outlet_id', outletId)
          .order('created_at', { ascending: false });
        if (error) throw error;

        const mapped = data.map(o => ({
          ...o,
          _id: o.id,
          customer_id: o.customer_id ? { ...o.customer_id, _id: o.customer_id.id } : null,
          cashier_id: o.cashier_id ? { ...o.cashier_id, _id: o.cashier_id.id } : null,
          items: Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'),
          payments: Array.isArray(o.payments) ? o.payments : JSON.parse(o.payments || '[]'),
          discounts: Array.isArray(o.discounts) ? o.discounts : JSON.parse(o.discounts || '[]'),
          taxes: Array.isArray(o.taxes) ? o.taxes : JSON.parse(o.taxes || '[]')
        }));
        return { data: mapped };
      }

      // 13. SHIFTS Log
      if (url.startsWith('/api/shifts')) {
        if (url.includes('/current')) {
          const { data, error } = await supabase
            .from('shifts')
            .select('*')
            .eq('cashier_id', user.id)
            .eq('status', 'open')
            .maybeSingle();
          if (error) throw error;
          return { data };
        } else {
          const { data, error } = await supabase
            .from('shifts')
            .select('*, cashier_id(*)')
            .eq('outlet_id', outletId)
            .order('opening_time', { ascending: false });
          if (error) throw error;
          const mapped = data.map(s => ({
            ...s,
            _id: s.id,
            cashier_id: s.cashier_id ? { ...s.cashier_id, _id: s.cashier_id.id } : null
          }));
          return { data: mapped };
        }
      }

      // 14. REPORTS
      if (url.startsWith('/api/reports')) {
        if (url.includes('/valuation')) {
          const { data, error } = await supabase
            .from('products')
            .select('*, category_id(*)')
            .eq('outlet_id', outletId);
          if (error) throw error;
          
          let totalStockValuationRetail = 0;
          let totalStockValuationCost = 0;
          const productList = data.map(p => {
            const retailVal = p.stock * p.base_price;
            const costVal = p.stock * p.cost_price;
            totalStockValuationRetail += retailVal;
            totalStockValuationCost += costVal;

            return {
              _id: p.id,
              name: p.name,
              sku: p.sku,
              category: p.category_id?.name || 'Uncategorized',
              stock: p.stock,
              basePrice: p.base_price,
              costPrice: p.cost_price,
              retailValue: retailVal,
              costValue: costVal
            };
          });

          return {
            data: {
              totalStockValuationRetail,
              totalStockValuationCost,
              productList
            }
          };
        } else if (url.includes('/dashboard')) {
          // Dashboard Analytics (Sales numbers, Daily trends, Top Products)
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('outlet_id', outletId)
            .eq('status', 'completed');
          if (ordersError) throw ordersError;

          let totalSales = 0;
          let totalCost = 0;
          let orderCount = orders ? orders.length : 0;
          
          // Map daily sales
          const dailyMap = {};
          const productMap = {};

          if (orders) {
            orders.forEach(o => {
              totalSales += Number(o.total);
              
              const dateStr = new Date(o.created_at).toLocaleDateString();
              if (!dailyMap[dateStr]) dailyMap[dateStr] = { sales: 0, profit: 0, count: 0 };
              dailyMap[dateStr].sales += Number(o.total);
              dailyMap[dateStr].count += 1;

              const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
              items.forEach(item => {
                totalCost += Number(item.cost || 0) * item.quantity;
                
                // Track top selling products
                if (!productMap[item.name]) productMap[item.name] = { name: item.name, value: 0 };
                productMap[item.name].value += item.quantity;

                // Profit check
                const itemProfit = (Number(item.price) - Number(item.cost || 0)) * item.quantity;
                dailyMap[dateStr].profit += itemProfit;
              });
            });
          }

          const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;
          const netProfit = totalSales - totalCost;

          // Format daily trends list
          const salesTrends = Object.keys(dailyMap).map(d => ({
            date: d,
            revenue: Number(dailyMap[d].sales.toFixed(2)),
            profit: Number(dailyMap[d].profit.toFixed(2))
          })).slice(-7); // Last 7 days

          // Format top selling products
          const topProducts = Object.values(productMap)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

          return {
            data: {
              totalSales: Number(totalSales.toFixed(2)),
              netProfit: Number(netProfit.toFixed(2)),
              orderCount,
              averageOrder: Number(averageOrder.toFixed(2)),
              salesTrends,
              topProducts
            }
          };
        }
      }

      throw new Error(`Endpoint GET ${url} not configured client-side.`);
    } catch (err) {
      console.error(`apiClient GET Error on ${url}:`, err);
      throw err;
    }
  },

  post: async (url, payload) => {
    try {
      const { user, outletId } = getActiveUser();

      // 1. PRODUCTS
      if (url.startsWith('/api/products')) {
        if (url.includes('/bulk-delete')) {
          const { error } = await supabase.from('products').delete().in('id', payload.ids);
          if (error) throw error;
          return { data: { message: 'Bulk delete successful' } };
        } else if (url.includes('/import')) {
          // Bulk CSV import parser handler
          const productsList = payload.products;
          for (const row of productsList) {
            // Find or create category
            let catId = null;
            if (row.category_name) {
              const { data: catData } = await supabase
                .from('categories')
                .select('id')
                .eq('name', row.category_name)
                .eq('outlet_id', outletId)
                .maybeSingle();

              if (catData) {
                catId = catData.id;
              } else {
                const { data: newCat } = await supabase
                  .from('categories')
                  .insert({ name: row.category_name, outlet_id: outletId, color: '#4F46E5' })
                  .select()
                  .single();
                catId = newCat.id;
              }
            }

            const { data: newProd, error: insertError } = await supabase
              .from('products')
              .insert({
                name: row.name,
                sku: row.sku,
                barcode: row.barcode || '',
                category_id: catId,
                base_price: Number(row.base_price),
                cost_price: Number(row.cost_price || 0),
                stock: Number(row.initial_stock || 0),
                outlet_id: outletId
              })
              .select()
              .single();

            if (!insertError && Number(row.initial_stock) > 0) {
              await supabase.from('inventory_logs').insert({
                product_id: newProd.id,
                type: 'in',
                quantity: Number(row.initial_stock),
                reason: 'CSV Bulk Import',
                performed_by: user.id,
                outlet_id: outletId
              });
            }
          }
          return { data: { message: 'Import successful' } };
        } else {
          // Regular product insert
          const { data, error } = await supabase
            .from('products')
            .insert({
              ...payload,
              stock: Number(payload.initial_stock || 0),
              outlet_id: outletId
            })
            .select()
            .single();
          if (error) throw error;

          if (Number(payload.initial_stock) > 0) {
            await supabase.from('inventory_logs').insert({
              product_id: data.id,
              type: 'in',
              quantity: Number(payload.initial_stock),
              reason: 'Opening Inventory Stock',
              performed_by: user.id,
              outlet_id: outletId
            });
          }
          return { data: { ...data, _id: data.id } };
        }
      }

      // 2. CATEGORIES
      if (url.startsWith('/api/categories')) {
        if (url.includes('/reorder')) {
          const orderList = payload.categories;
          for (const item of orderList) {
            await supabase
              .from('categories')
              .update({ sort_order: item.sort_order })
              .eq('id', item._id || item.id);
          }
          return { data: { success: true } };
        } else {
          const { data, error } = await supabase
            .from('categories')
            .insert({ ...payload, outlet_id: outletId })
            .select()
            .single();
          if (error) throw error;
          return { data: { ...data, _id: data.id } };
        }
      }

      // 3. CUSTOMERS
      if (url.startsWith('/api/customers')) {
        const { data, error } = await supabase
          .from('customers')
          .insert({ ...payload, outlet_id: outletId })
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 4. DISCOUNT TYPES
      if (url.startsWith('/api/discount-types')) {
        const { data, error } = await supabase
          .from('discount_types')
          .insert({ ...payload, outlet_id: outletId })
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 5. TAX RATES
      if (url.startsWith('/api/tax-rates')) {
        const { data, error } = await supabase
          .from('tax_rates')
          .insert({ ...payload, outlet_id: outletId })
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 6. PAYMENT METHODS
      if (url.startsWith('/api/payment-methods')) {
        const { data, error } = await supabase
          .from('payment_methods')
          .insert({ ...payload, outlet_id: outletId })
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 7. STOCK ADJUSTMENT REASONS
      if (url.startsWith('/api/stock-adjustment-reasons')) {
        const { data, error } = await supabase
          .from('stock_adjustment_reasons')
          .insert({ ...payload, outlet_id: outletId })
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 8. OUTLETS
      if (url.startsWith('/api/outlets')) {
        const { data, error } = await supabase
          .from('outlets')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 9. STAFF USERS (Inviting/Signing up)
      if (url.startsWith('/api/users')) {
        // Invite via signup. In frontend, standard signup can create cashiers.
        // We'll write to profiles table.
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            id: payload.id || gen_random_uuid(), // if created on auth.users beforehand
            name: payload.name,
            email: payload.email,
            role: payload.role,
            outlet_id: outletId
          })
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 10. INVENTORY LOGS & ACTIONS
      if (url.startsWith('/api/inventory')) {
        if (url.includes('/adjust')) {
          const { product_id, type, quantity, reason } = payload;
          const { data: prod } = await supabase.from('products').select('stock').eq('id', product_id).single();
          
          const currentStock = Number(prod.stock);
          const diff = type === 'in' ? Number(quantity) : -Number(quantity);
          const newStock = Math.max(0, currentStock + diff);

          await supabase.from('products').update({ stock: newStock }).eq('id', product_id);

          const { data: log, error } = await supabase
            .from('inventory_logs')
            .insert({
              product_id,
              type,
              quantity,
              reason,
              performed_by: user.id,
              outlet_id: outletId
            })
            .select()
            .single();

          if (error) throw error;
          return { data: { ...log, _id: log.id } };
        } else if (url.includes('/transfer')) {
          const { product_id, source_outlet_id, target_outlet_id, quantity } = payload;
          
          const { data: sourceProd } = await supabase.from('products').select('*').eq('id', product_id).single();
          await supabase.from('products').update({ stock: Math.max(0, Number(sourceProd.stock) - Number(quantity)) }).eq('id', product_id);

          await supabase.from('inventory_logs').insert({
            product_id,
            type: 'transfer',
            quantity: -Number(quantity),
            reason: `Transfer to target outlet`,
            performed_by: user.id,
            outlet_id: source_outlet_id
          });

          const { data: targetProd } = await supabase
            .from('products')
            .select('*')
            .eq('sku', sourceProd.sku)
            .eq('outlet_id', target_outlet_id)
            .maybeSingle();

          let targetProdId;
          if (targetProd) {
            targetProdId = targetProd.id;
            await supabase.from('products').update({ stock: Number(targetProd.stock) + Number(quantity) }).eq('id', targetProd.id);
          } else {
            const { data: newTargetProd } = await supabase
              .from('products')
              .insert({
                name: sourceProd.name,
                sku: sourceProd.sku,
                barcode: sourceProd.barcode,
                base_price: sourceProd.base_price,
                cost_price: sourceProd.cost_price,
                stock: Number(quantity),
                stock_threshold: sourceProd.stock_threshold,
                status: sourceProd.status,
                variants: sourceProd.variants,
                outlet_id: target_outlet_id
              })
              .select()
              .single();
            targetProdId = newTargetProd.id;
          }

          await supabase.from('inventory_logs').insert({
            product_id: targetProdId,
            type: 'transfer',
            quantity: Number(quantity),
            reason: `Transfer from source outlet`,
            performed_by: user.id,
            outlet_id: target_outlet_id
          });

          return { data: { success: true } };
        }
      }

      // 11. SHIFTS
      if (url.startsWith('/api/shifts')) {
        if (url.includes('/open')) {
          const { data, error } = await supabase
            .from('shifts')
            .insert({
              cashier_id: user.id,
              opening_balance: Number(payload.opening_cash),
              status: 'open',
              outlet_id: outletId
            })
            .select()
            .single();
          if (error) throw error;
          return { data: { ...data, _id: data.id } };
        } else if (url.includes('/close')) {
          const { data: openShift } = await supabase
            .from('shifts')
            .select('*')
            .eq('cashier_id', user.id)
            .eq('status', 'open')
            .single();

          const { data: orders } = await supabase
            .from('orders')
            .select('payments, status')
            .eq('cashier_id', user.id)
            .eq('status', 'completed')
            .gte('created_at', openShift.opening_time);

          let cashSales = 0;
          if (orders) {
            orders.forEach(o => {
              const paymentsArray = Array.isArray(o.payments) ? o.payments : JSON.parse(o.payments || '[]');
              paymentsArray.forEach(p => {
                if (p.method.toLowerCase() === 'cash') cashSales += Number(p.amount);
              });
            });
          }

          const expectedCash = Number(openShift.opening_balance) + cashSales;

          const { data, error } = await supabase
            .from('shifts')
            .update({
              closing_time: new Date().toISOString(),
              expected_cash: expectedCash,
              actual_cash: Number(payload.actual_closing_cash),
              status: 'closed'
            })
            .eq('id', openShift.id)
            .select()
            .single();

          if (error) throw error;
          return { data: { ...data, _id: data.id } };
        }
      }

      // 12. ORDERS (Checkout submission and refunds/voids)
      if (url.startsWith('/api/orders')) {
        const orderId = extractId(url, '/api/orders/');
        
        if (url.includes('/refund') && orderId) {
          const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
          await supabase.from('orders').update({ status: 'refunded' }).eq('id', orderId);

          // Restore product stock levels
          const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
          for (const item of items) {
            const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
            if (prod) {
              const newStock = Number(prod.stock) + Number(item.quantity);
              await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);

              await supabase.from('inventory_logs').insert({
                product_id: item.product_id,
                type: 'in',
                quantity: item.quantity,
                reason: `Refund for Order #${orderId.substring(0, 8)}`,
                performed_by: user.id,
                outlet_id: outletId
              });
            }
          }

          // Restore customer points if used
          if (order.customer_id && order.redeemedPoints > 0) {
            const { data: cust } = await supabase.from('customers').select('loyalty_points').eq('id', order.customer_id).single();
            if (cust) {
              await supabase.from('customers').update({
                loyalty_points: Number(cust.loyalty_points) + Number(order.redeemedPoints)
              }).eq('id', order.customer_id);
            }
          }

          return { data: { ...order, status: 'refunded' } };
        }

        if (url.includes('/void') && orderId) {
          const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
          await supabase.from('orders').update({ status: 'voided' }).eq('id', orderId);

          const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
          for (const item of items) {
            const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single();
            if (prod) {
              const newStock = Number(prod.stock) + Number(item.quantity);
              await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);

              await supabase.from('inventory_logs').insert({
                product_id: item.product_id,
                type: 'in',
                quantity: item.quantity,
                reason: `Void for Order #${orderId.substring(0, 8)}`,
                performed_by: user.id,
                outlet_id: outletId
              });
            }
          }
          return { data: { ...order, status: 'voided' } };
        }

        // New Order Save
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
            discounts: payload.discounts,
            taxes: payload.taxes,
            items: payload.items,
            outlet_id: outletId
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
              quantity: item.quantity,
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
            // Get setting rules
            const { data: sett } = await supabase.from('settings').select('loyalty_earn_rate').eq('outlet_id', outletId).single();
            const earnRate = sett ? Number(sett.loyalty_earn_rate) : 1;
            const pointsEarned = Math.floor(Number(payload.total) * earnRate);
            const pointsRedeemed = Number(payload.redeemedPoints || 0);

            const nextPoints = Math.max(0, Number(cust.loyalty_points) + pointsEarned - pointsRedeemed);
            await supabase.from('customers').update({ loyalty_points: nextPoints }).eq('id', payload.customer_id);
          }
        }

        return { data: { ...data, _id: data.id } };
      }

      throw new Error(`Endpoint POST ${url} not configured client-side.`);
    } catch (err) {
      console.error(`apiClient POST Error on ${url}:`, err);
      throw err;
    }
  },

  put: async (url, payload) => {
    try {
      const { user, outletId } = getActiveUser();

      // 1. PRODUCTS
      if (url.startsWith('/api/products/')) {
        const id = extractId(url, '/api/products/');
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 2. CATEGORIES
      if (url.startsWith('/api/categories/')) {
        const id = extractId(url, '/api/categories/');
        const { data, error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 3. CUSTOMERS
      if (url.startsWith('/api/customers/')) {
        const id = extractId(url, '/api/customers/');
        const { data, error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 4. DISCOUNT TYPES
      if (url.startsWith('/api/discount-types/')) {
        const id = extractId(url, '/api/discount-types/');
        const { data, error } = await supabase
          .from('discount_types')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 5. TAX RATES
      if (url.startsWith('/api/tax-rates/')) {
        const id = extractId(url, '/api/tax-rates/');
        const { data, error } = await supabase
          .from('tax_rates')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 6. PAYMENT METHODS
      if (url.startsWith('/api/payment-methods/')) {
        const id = extractId(url, '/api/payment-methods/');
        const { data, error } = await supabase
          .from('payment_methods')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 7. STOCK ADJUSTMENT REASONS
      if (url.startsWith('/api/stock-adjustment-reasons/')) {
        const id = extractId(url, '/api/stock-adjustment-reasons/');
        const { data, error } = await supabase
          .from('stock_adjustment_reasons')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 8. OUTLETS
      if (url.startsWith('/api/outlets/')) {
        const id = extractId(url, '/api/outlets/');
        const { data, error } = await supabase
          .from('outlets')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 9. STAFF USERS (PROFILES)
      if (url.startsWith('/api/users/')) {
        const id = extractId(url, '/api/users/');
        const { data, error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 10. SETTINGS
      if (url.startsWith('/api/settings')) {
        const { data: existing } = await supabase.from('settings').select('id').eq('outlet_id', outletId).maybeSingle();
        if (existing) {
          const { data, error } = await supabase.from('settings').update(payload).eq('id', existing.id).select().single();
          if (error) throw error;
          return { data: { settings: data } };
        } else {
          const { data, error } = await supabase.from('settings').insert({ ...payload, outlet_id: outletId }).select().single();
          if (error) throw error;
          return { data: { settings: data } };
        }
      }

      throw new Error(`Endpoint PUT ${url} not configured client-side.`);
    } catch (err) {
      console.error(`apiClient PUT Error on ${url}:`, err);
      throw err;
    }
  },

  delete: async (url) => {
    try {
      const { user, outletId } = getActiveUser();

      // 1. PRODUCTS
      if (url.startsWith('/api/products/')) {
        const id = extractId(url, '/api/products/');
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 2. CATEGORIES
      if (url.startsWith('/api/categories/')) {
        const id = extractId(url, '/api/categories/');
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 3. CUSTOMERS
      if (url.startsWith('/api/customers/')) {
        const id = extractId(url, '/api/customers/');
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 4. DISCOUNT TYPES
      if (url.startsWith('/api/discount-types/')) {
        const id = extractId(url, '/api/discount-types/');
        const { error } = await supabase.from('discount_types').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 5. TAX RATES
      if (url.startsWith('/api/tax-rates/')) {
        const id = extractId(url, '/api/tax-rates/');
        const { error } = await supabase.from('tax_rates').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 6. PAYMENT METHODS
      if (url.startsWith('/api/payment-methods/')) {
        const id = extractId(url, '/api/payment-methods/');
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 7. STOCK ADJUSTMENT REASONS
      if (url.startsWith('/api/stock-adjustment-reasons/')) {
        const id = extractId(url, '/api/stock-adjustment-reasons/');
        const { error } = await supabase.from('stock_adjustment_reasons').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 8. OUTLETS
      if (url.startsWith('/api/outlets/')) {
        const id = extractId(url, '/api/outlets/');
        const { error } = await supabase.from('outlets').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      // 9. STAFF USERS (PROFILES)
      if (url.startsWith('/api/users/')) {
        const id = extractId(url, '/api/users/');
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        return { data: { success: true } };
      }

      throw new Error(`Endpoint DELETE ${url} not configured client-side.`);
    } catch (err) {
      console.error(`apiClient DELETE Error on ${url}:`, err);
      throw err;
    }
  }
};

export default apiClient;
