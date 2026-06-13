import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from '../store/useAuthStore';
import { cacheProducts, getCachedProducts, cacheCategories, getCachedCategories } from '../lib/offlineDB';
import { createOrder } from '../lib/createOrder';

// Helper to get active user details
const getActiveUser = () => {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Not authenticated');
  const outletId = user.outlet_id?.id || (typeof user.outlet_id === 'string' ? user.outlet_id : null);
  if (!outletId) throw new Error('No outlet assigned to your account. Please contact your administrator.');
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
        if (!navigator.onLine) {
          const cached = await getCachedProducts(outletId);
          if (cached && cached.length > 0) {
            return { data: cached.map(item => ({ ...item, _id: item.id })) };
          }
        }
        const { data, error } = await supabase
          .from('products')
          .select('*, category_id(*), tax_rate_id(*)')
          .eq('outlet_id', outletId);
        if (error) throw error;
        // Map keys to _id for React page compatibility
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        await cacheProducts(mapped, outletId);
        return { data: mapped };
      }

      // 2. CATEGORIES
      if (url.startsWith('/api/categories')) {
        if (!navigator.onLine) {
          const cached = await getCachedCategories(outletId);
          if (cached && cached.length > 0) {
            return { data: cached.map(item => ({ ...item, _id: item.id })) };
          }
        }
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('outlet_id', outletId)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        const mapped = data.map(item => ({ ...item, _id: item.id }));
        await cacheCategories(mapped, outletId);
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
        const mapped = data.map(item => ({ ...item, _id: item.id, label: item.name }));
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
          role: 'admin',
          _id: item.id,
          outlet_id: item.outlet_id ? { ...item.outlet_id, _id: item.outlet_id.id } : null
        }));
        return { data: mapped };
      }

      // 10. SETTINGS
      if (url.startsWith('/api/settings')) {
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('outlet_id', outletId)
          .maybeSingle();
        if (settingsError) throw settingsError;

        const { data: outletData, error: outletError } = await supabase
          .from('outlets')
          .select('*')
          .eq('id', outletId)
          .maybeSingle();
        if (outletError) throw outletError;

        return { data: { settings: settingsData, outlet: outletData } };
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
            performed_by: item.performed_by ? { ...item.performed_by, _id: item.performed_by.id } : null,
            user_id: item.performed_by ? { ...item.performed_by, _id: item.performed_by.id } : null,
            change: item.quantity,
            timestamp: item.created_at
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
            product: {
              ...item,
              _id: item.id,
              category_id: item.category_id ? { ...item.category_id, _id: item.category_id.id } : null
            },
            quantity: item.stock,
            isLowStock: item.stock <= item.stock_threshold
          }));
          return { data: mapped };
        }
      }

      // 12. ORDERS
      if (url.startsWith('/api/orders')) {
        // Parse query params from the URL string
        const urlObj = new URL(url, 'http://localhost');
        const statusParam = urlObj.searchParams.get('status') || 'all';
        const startDateParam = urlObj.searchParams.get('startDate') || '';
        const endDateParam = urlObj.searchParams.get('endDate') || '';

        let query = supabase
          .from('orders')
          .select('*, customer_id(*), cashier_id(*)')
          .eq('outlet_id', outletId)
          .order('created_at', { ascending: false });

        // Status filter
        if (statusParam && statusParam !== 'all') {
          query = query.eq('status', statusParam);
        }

        // Date range filters — endDate gets end-of-day so it's inclusive
        if (startDateParam) {
          query = query.gte('created_at', `${startDateParam}T00:00:00.000Z`);
        }
        if (endDateParam) {
          query = query.lte('created_at', `${endDateParam}T23:59:59.999Z`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const mapped = data.map(o => ({
          ...o,
          _id: o.id,
          createdAt: o.created_at,
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
        if (url.includes('/sales')) {
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*, customer_id(*), cashier_id(*)')
            .eq('outlet_id', outletId)
            .order('created_at', { ascending: false });
          if (ordersError) throw ordersError;

          const completedOrders = ordersData.filter(o => o.status === 'completed');
          let totalRevenue = 0;
          let totalCost = 0;
          
          const dailyMap = {};
          const productMap = {};

          completedOrders.forEach(o => {
            totalRevenue += Number(o.total);
            
            const dateStr = new Date(o.created_at).toLocaleDateString();
            if (!dailyMap[dateStr]) dailyMap[dateStr] = { sales: 0, profit: 0 };
            dailyMap[dateStr].sales += Number(o.total);

            const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]');
            items.forEach(item => {
              const qty = Number(item.quantity || 0);
              const price = Number(item.price || 0);
              const cost = Number(item.cost || 0);
              
              totalCost += cost * qty;
              
              if (!productMap[item.name]) {
                productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
              }
              productMap[item.name].quantity += qty;
              productMap[item.name].revenue += price * qty;

              const itemProfit = (price - cost) * qty;
              dailyMap[dateStr].profit += itemProfit;
            });
          });

          const orderCount = completedOrders.length;
          const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
          const grossProfit = totalRevenue - totalCost;

          const chartData = Object.keys(dailyMap).map(d => ({
            date: d,
            sales: Number(dailyMap[d].sales.toFixed(2)),
            profit: Number(dailyMap[d].profit.toFixed(2))
          })).reverse();

          const topProducts = Object.values(productMap)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

          const mappedOrders = ordersData.map(o => ({
            ...o,
            _id: o.id,
            createdAt: o.created_at,
            customer_id: o.customer_id ? { ...o.customer_id, _id: o.customer_id.id } : null,
            cashier_id: o.cashier_id ? { ...o.cashier_id, _id: o.cashier_id.id } : null,
            items: Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'),
            payments: Array.isArray(o.payments) ? o.payments : JSON.parse(o.payments || '[]'),
            discounts: Array.isArray(o.discounts) ? o.discounts : JSON.parse(o.discounts || '[]'),
            taxes: Array.isArray(o.taxes) ? o.taxes : JSON.parse(o.taxes || '[]')
          }));

          return {
            data: {
              metrics: {
                totalRevenue: Number(totalRevenue.toFixed(2)),
                grossProfit: Number(grossProfit.toFixed(2)),
                orderCount,
                averageOrderValue: Number(averageOrderValue.toFixed(2))
              },
              chartData,
              topProducts,
              orders: mappedOrders
            }
          };
        } else if (url.includes('/inventory') || url.includes('/valuation')) {
          const { data, error } = await supabase
            .from('products')
            .select('*, category_id(*)')
            .eq('outlet_id', outletId);
          if (error) throw error;

          let totalValuationRetail = 0;
          let totalValuationCost = 0;
          let lowStockCount = 0;

          const items = data.map(p => {
            const retailVal = p.stock * p.base_price;
            const costVal = p.stock * p.cost_price;
            totalValuationRetail += retailVal;
            totalValuationCost += costVal;
            if (p.stock <= p.stock_threshold) {
              lowStockCount++;
            }

            return {
              name: p.name,
              sku: p.sku,
              quantity: p.stock,
              price: p.base_price,
              cost: p.cost_price,
              valuationRetail: retailVal,
              valuationCost: costVal
            };
          });

          return {
            data: {
              metrics: {
                totalItems: data.length,
                lowStockCount,
                totalValuationCost,
                totalValuationRetail
              },
              items
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
          const { initial_stock, ...insertData } = payload;
          const { data, error } = await supabase
            .from('products')
            .insert({
              ...insertData,
              stock: Number(initial_stock || 0),
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
          const orderList = payload.categories || payload.orders;
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
            role: 'admin',
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
          const { product_id, reason } = payload;
          const changeVal = Number(payload.change !== undefined ? payload.change : (payload.quantity !== undefined ? (payload.type === 'out' ? -payload.quantity : payload.quantity) : 0));
          const qty = Math.abs(changeVal);
          const type = changeVal >= 0 ? 'in' : 'out';
          const { data: prod } = await supabase.from('products').select('stock').eq('id', product_id).single();
          
          const currentStock = Number(prod.stock);
          const newStock = Math.max(0, currentStock + changeVal);

          await supabase.from('products').update({ stock: newStock }).eq('id', product_id);

          const { data: log, error } = await supabase
            .from('inventory_logs')
            .insert({
              product_id,
              type,
              quantity: changeVal,
              reason,
              performed_by: user.id,
              outlet_id: outletId
            })
            .select()
            .single();

          if (error) throw error;
          return { data: { ...log, _id: log.id } };
        } else if (url.includes('/transfer')) {
          const { product_id, quantity } = payload;
          const source_outlet_id = payload.source_outlet_id || payload.from_outlet_id;
          const target_outlet_id = payload.target_outlet_id || payload.to_outlet_id;
          
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

        // New Order Save (online-first/offline backup handled by createOrder)
        const res = await createOrder(payload, user, outletId);
        if (!res.success) {
          throw new Error(res.error || 'Failed to create order');
        }
        return { data: { ...res.order, _id: res.order.id, createdAt: res.order.created_at } };
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
          .update({ ...payload, role: 'admin' })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: { ...data, _id: data.id } };
      }

      // 10. SETTINGS
      if (url.startsWith('/api/settings/profile')) {
        const updateData = {
          name: payload.name,
          address: payload.address,
          receipt_footer: payload.receiptSettings?.footerText || '',
        };
        const { data, error } = await supabase
          .from('outlets')
          .update(updateData)
          .eq('id', outletId)
          .select()
          .single();
        if (error) throw error;
        return { data: { outlet: data } };
      }

      if (url.startsWith('/api/settings')) {
        const { data: existing } = await supabase.from('settings').select('id').eq('outlet_id', outletId).maybeSingle();
        if (existing) {
          const { data, error } = await supabase.from('settings').update(payload.settings || payload).eq('id', existing.id).select().single();
          if (error) throw error;
          return { data: { settings: data } };
        } else {
          const { data, error } = await supabase.from('settings').insert({ ...(payload.settings || payload), outlet_id: outletId }).select().single();
          if (error) throw error;
          return { data: { settings: data } };
        }
      }

      // 12. ORDERS void / refund
      if (url.startsWith('/api/orders')) {
        const orderId = extractId(url, '/api/orders/');
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
          return { data: { ...order, status: 'voided', createdAt: order.created_at } };
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
