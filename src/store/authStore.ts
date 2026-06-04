// File Path: d:/Projects/Web/Universal POS/src/store/authStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Store, StoreMember } from '../types'

interface AuthState {
  user: User | null;
  activeStore: Store | null;
  activeMember: StoreMember | null;
  loading: boolean;
  setActiveStore: (store: Store | null, member: StoreMember | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      activeStore: null,
      activeMember: null,
      loading: (() => {
        try {
          const stored = localStorage.getItem('pos-auth-storage')
          if (stored) {
            const parsed = JSON.parse(stored)
            return !parsed.state?.user
          }
        } catch (_) {}
        return true
      })(),
      
      setActiveStore: (store, member) => set({ 
        activeStore: store, 
        activeMember: member 
      }),
      
      setUser: (user) => set({ 
        user 
      }),

      setLoading: (loading) => set({
        loading
      }),
      
      logout: () => set({ 
        user: null, 
        activeStore: null, 
        activeMember: null,
        loading: false
      }),
    }),
    {
      name: 'pos-auth-storage',
      partialize: (state) => ({
        user: state.user,
        activeStore: state.activeStore,
        activeMember: state.activeMember,
      }),
    }
  )
)
