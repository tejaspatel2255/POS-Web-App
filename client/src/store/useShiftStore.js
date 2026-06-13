import { create } from 'zustand';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

export const useShiftStore = create((set, get) => ({
  currentShift: null,
  loading: true,
  allShifts: [],

  fetchCurrentShift: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/api/shifts/current');
      set({ currentShift: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({ currentShift: null, loading: false });
    }
  },

  openShift: async (openingCash) => {
    set({ loading: true });
    try {
      const response = await apiClient.post('/api/shifts/open', {
        opening_cash: Number(openingCash),
      });
      set({ currentShift: response.data, loading: false });
      toast.success('Shift opened successfully! Cash drawer initialized.');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error opening shift';
      toast.error(msg);
      set({ loading: false });
      throw err;
    }
  },

  closeShift: async (actualClosingCash) => {
    set({ loading: true });
    try {
      const response = await apiClient.post('/api/shifts/close', {
        actual_closing_cash: Number(actualClosingCash),
      });
      set({ currentShift: null, loading: false });
      
      const discrepancy = response.data.actual_closing_cash - response.data.closing_cash;
      if (discrepancy === 0) {
        toast.success('Shift closed successfully! Drawer balanced.');
      } else {
        toast.warn(`Shift closed with discrepancy of $${discrepancy.toFixed(2)}`);
      }
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error closing shift';
      toast.error(msg);
      set({ loading: false });
      throw err;
    }
  },

  fetchShiftsLog: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/api/shifts');
      set({ allShifts: response.data, loading: false });
    } catch (err) {
      toast.error('Error fetching shifts log');
      set({ loading: false });
    }
  },
}));
