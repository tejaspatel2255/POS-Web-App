import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  setSession: (session) => set({ session }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Sync user with MongoDB backend
      const response = await apiClient.post('/api/auth/sync', {
        email: data.user.email,
        supabaseUid: data.user.id,
      });

      set({ user: response.data.user, session: data.session, loading: false });
      toast.success(`Welcome back, ${response.data.user.name}!`);
      return response.data.user;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      set({ error: message, loading: false });
      toast.error(message);
      throw err;
    }
  },

  signup: async (email, password, name, role = 'admin', outletId = null) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;

      // Sync newly signed up user with MongoDB
      const response = await apiClient.post('/api/auth/sync', {
        email,
        name,
        role,
        outletId,
        supabaseUid: data.user.id,
      });

      toast.success('Registration successful!');
      set({ loading: false });
      return response.data.user;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Signup failed';
      set({ error: message, loading: false });
      toast.error(message);
      throw err;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null, loading: false });
      toast.success('Logged out successfully');
    } catch (err) {
      set({ loading: false });
      toast.error(err.message || 'Logout failed');
    }
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Fetch/sync user details from MongoDB
        const response = await apiClient.post('/api/auth/sync', {
          email: session.user.email,
          supabaseUid: session.user.id,
        });
        
        set({ user: response.data.user, session, loading: false });
      } else {
        set({ user: null, session: null, loading: false });
      }
    } catch (err) {
      console.error('Auth check error:', err);
      set({ user: null, session: null, loading: false });
    }
  },
}));
