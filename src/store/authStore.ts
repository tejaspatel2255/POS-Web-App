// File Path: d:/Projects/Web/Universal POS/src/store/authStore.ts

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@supabase/supabase-js'
import type { Store, StoreMember } from '../types'

interface AuthState {
  user: User | null;
  activeStore: Store | null;
  activeMember: StoreMember | null;
  setUser: (user: User | null) => void;
  setActiveStore: (store: Store | null) => void;
  setActiveMember: (member: StoreMember | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      activeStore: null,
      activeMember: null,
      setUser: (user) => set({ user }),
      setActiveStore: (store) => set({ activeStore: store }),
      setActiveMember: (member) => set({ activeMember: member }),
      logout: () => set({ user: null, activeStore: null, activeMember: null }),
    }),
    {
      name: 'universal-pos-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
