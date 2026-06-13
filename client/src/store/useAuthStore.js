import { create } from 'zustand';
import { supabase } from '../utils/supabaseClient';
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

      // Fetch user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, outlet_id(*)')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      set({ user: profile, session: data.session, loading: false });
      toast.success(`Welcome back, ${profile.name || 'User'}!`);
      return profile;
    } catch (err) {
      const message = err.message || 'Login failed';
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

      toast.success('Registration successful! Please login.');
      set({ loading: false });
      return data.user;
    } catch (err) {
      const message = err.message || 'Signup failed';
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
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, outlet_id(*)')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          // If no profile yet, wait or sign out
          set({ user: null, session: null, loading: false });
        } else {
          set({ user: profile, session, loading: false });
        }
      } else {
        set({ user: null, session: null, loading: false });
      }
    } catch (err) {
      console.error('Auth check error:', err);
      set({ user: null, session: null, loading: false });
    }
  },
}));
