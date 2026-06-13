import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import { useAuthStore } from './useAuthStore';
import toast from 'react-hot-toast';

export const useShiftStore = create((set, get) => ({
  currentShift: null,
  loading: true,
  allShifts: [],

  fetchCurrentShift: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return null;
    
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('cashier_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      if (error) throw error;
      set({ currentShift: data, loading: false });
      return data;
    } catch (err) {
      set({ currentShift: null, loading: false });
      return null;
    }
  },

  openShift: async (openingCash) => {
    const user = useAuthStore.getState().user;
    if (!user || !user.outlet_id) {
      toast.error('You must belong to an outlet to open a shift.');
      return;
    }

    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert({
          cashier_id: user.id,
          opening_balance: Number(openingCash),
          status: 'open',
          outlet_id: user.outlet_id.id || user.outlet_id,
          opening_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      set({ currentShift: data, loading: false });
      toast.success('Shift opened successfully! Cash drawer initialized.');
      return data;
    } catch (err) {
      toast.error(err.message || 'Error opening shift');
      set({ loading: false });
      throw err;
    }
  },

  closeShift: async (actualClosingCash) => {
    const { currentShift } = get();
    const user = useAuthStore.getState().user;
    if (!currentShift) return;

    set({ loading: true });
    try {
      // 1. Calculate expected cash from orders during this shift
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('payments, status')
        .eq('cashier_id', user.id)
        .eq('status', 'completed')
        .gte('created_at', currentShift.opening_time);

      if (ordersError) throw ordersError;

      let cashSales = 0;
      if (orders) {
        orders.forEach((o) => {
          const paymentsArray = Array.isArray(o.payments) ? o.payments : JSON.parse(o.payments || '[]');
          paymentsArray.forEach((p) => {
            if (p.method.toLowerCase() === 'cash') {
              cashSales += Number(p.amount);
            }
          });
        });
      }

      const expectedCash = Number(currentShift.opening_balance) + cashSales;

      // 2. Update the shift record
      const { data: closedShift, error: closeError } = await supabase
        .from('shifts')
        .update({
          closing_time: new Date().toISOString(),
          expected_cash: expectedCash,
          actual_cash: Number(actualClosingCash),
          status: 'closed'
        })
        .eq('id', currentShift.id)
        .select()
        .single();

      if (closeError) throw closeError;

      set({ currentShift: null, loading: false });
      
      const discrepancy = Number(actualClosingCash) - expectedCash;
      if (discrepancy === 0) {
        toast.success('Shift closed successfully! Drawer balanced.');
      } else {
        toast(`Shift closed with discrepancy of ₹${discrepancy.toFixed(2)}`, {
          icon: '⚠️'
        });
      }
      return closedShift;
    } catch (err) {
      toast.error(err.message || 'Error closing shift');
      set({ loading: false });
      throw err;
    }
  },

  fetchShiftsLog: async () => {
    const user = useAuthStore.getState().user;
    if (!user || !user.outlet_id) return;

    set({ loading: true });
    try {
      const outletUuid = user.outlet_id.id || user.outlet_id;
      const { data, error } = await supabase
        .from('shifts')
        .select('*, cashier_id(*)')
        .eq('outlet_id', outletUuid)
        .order('opening_time', { ascending: false });

      if (error) throw error;
      set({ allShifts: data, loading: false });
    } catch (err) {
      toast.error('Error fetching shifts log');
      set({ loading: false });
    }
  },
}));
