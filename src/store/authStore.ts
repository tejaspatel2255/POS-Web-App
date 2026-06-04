// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { Store, StoreMember } from '../types'

interface AuthState {
  user: User | null
  activeStore: Store | null
  activeMember: StoreMember | null
  setUser: (user: User | null) => void
  setActiveStore: (store: Store | null) => void
  setActiveMember: (member: StoreMember | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      activeStore: null,
      activeMember: null,
      setUser: (user) => set({ user }),
      setActiveStore: (activeStore) => set({ activeStore }),
      setActiveMember: (activeMember) => set({ activeMember }),
      logout: () => {
        set({ user: null, activeStore: null, activeMember: null })
      },
    }),
    {
      name: 'pos-auth',
      partialize: (state) => ({
        user: state.user,
        activeStore: state.activeStore,
        activeMember: state.activeMember,
      }),
    }
  )
)
