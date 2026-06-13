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
      let profile = null;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, outlet_id(*)')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        // Auto-create missing profile for existing user
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: data.user.email.split('@')[0],
            email: data.user.email,
            role: 'admin'
          })
          .select('*, outlet_id(*)')
          .maybeSingle();
        if (createError) throw createError;
        profile = newProfile;
      } else {
        profile = profileData;
      }

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
        let profile = null;
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*, outlet_id(*)')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (profileData) {
          profile = profileData;
        } else if (!profileError) {
          // Auto-create missing profile
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              name: session.user.email.split('@')[0],
              email: session.user.email,
              role: 'admin'
            })
            .select('*, outlet_id(*)')
            .maybeSingle();
          if (!createError) {
            profile = newProfile;
          }
        }
           
        if (!profile) {
          // If no profile could be fetched/created, sign out
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
