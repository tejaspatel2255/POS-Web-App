// File Path: d:/Projects/Web/Universal POS/src/store/authStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Store, StoreMember } from '../types'

interface AuthState {
  user: User | null;
  activeStore: Store | null;
  activeMember: StoreMember | null;
  setActiveStore: (store: Store | null, member: StoreMember | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      activeStore: null,
      activeMember: null,
      
      setActiveStore: (store, member) => set({ 
        activeStore: store, 
        activeMember: member 
      }),
      
      setUser: (user) => set({ 
        user 
      }),
      
      logout: () => set({ 
        user: null, 
        activeStore: null, 
        activeMember: null 
      }),
    }),
    {
      name: 'pos-auth-storage',
    }
  )
)
