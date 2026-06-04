// File Path: d:/Projects/Web/Universal POS/src/hooks/useAuth.ts

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'
import { syncPendingOrders } from '../lib/syncEngine'
import type { Store, StoreMember } from '../types'

let authListenerInitialized = false

export function useAuth() {
  const { user, activeStore, activeMember, setActiveStore, setActiveMember, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authListenerInitialized) return
    authListenerInitialized = true

    // 1. Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        const hasCachedState = !!activeStore && !!activeMember
        await syncUserStoreMembership(currentUser.id, hasCachedState)
        syncPendingOrders()
      } else {
        setLoading(false)
      }
    })

    // 2. Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      if (currentUser) {
        const hasCachedState = !!activeStore && !!activeMember
        await syncUserStoreMembership(currentUser.id, hasCachedState)
        syncPendingOrders()
      } else {
        logout()
        setLoading(false)
      }
    })

    return () => {
      // Global listener persists across mounts
    }
  }, [])

  const syncUserStoreMembership = async (userId: string, silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      // Fetch all store memberships for the user, joining the store info
      const { data: members, error } = await (supabase
        .from('store_members') as any)
        .select(`
          id,
          store_id,
          user_id,
          role,
          full_name,
          is_active,
          created_at,
          store:stores (
            id,
            name,
            tagline,
            logo_url,
            address,
            phone,
            email,
            currency_symbol,
            currency_code,
            tax_rate,
            default_parcel_charges,
            receipt_footer,
            theme_color,
            store_type,
            is_active,
            created_at
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) throw error

      if (!members || members.length === 0) {
        // No stores found - user needs to create one
        setActiveStore(null)
        setActiveMember(null)
      } else {
        // User has stores. Check if their current activeStore is still valid
        const stillMemberOfActive = activeStore 
          ? members.find((m: any) => m.store_id === activeStore.id) 
          : null

        if (stillMemberOfActive) {
          // Keep the current active store, update the member role/details
          const { store, ...memberData } = stillMemberOfActive as any
          setActiveStore(store as unknown as Store)
          setActiveMember(memberData as unknown as StoreMember)
        } else if (members.length === 1) {
          // If only 1 store, set it automatically
          const { store, ...memberData } = members[0] as any
          setActiveStore(store as unknown as Store)
          setActiveMember(memberData as unknown as StoreMember)
        } else {
          // Multiple stores, let user select one (do not force first one if they already selected)
          if (!activeStore) {
            setActiveStore(null)
            setActiveMember(null)
          }
        }
      }
    } catch (err) {
      console.error('Error syncing store memberships:', err)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  return {
    user,
    activeStore,
    activeMember,
    loading,
    refreshStoreMembership: () => user && syncUserStoreMembership(user.id)
  }
}
