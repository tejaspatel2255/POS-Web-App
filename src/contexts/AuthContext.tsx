// File Path: d:/Projects/Web/Universal POS/src/contexts/AuthContext.tsx

import { createContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { useAuthStore } from '../store/authStore'
import { useAuth as useAuthHook } from '../hooks/useAuth'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: {
    id: string
    role: 'owner' | 'admin' | 'cashier'
    full_name: string | null
    created_at: string
  } | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, activeMember, loading: authLoading } = useAuthHook()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const { logout } = useAuthStore.getState()
    await supabase.auth.signOut()
    logout()
  }

  // Map the new activeMember object to the legacy profile structure
  const profile = activeMember ? {
    id: activeMember.id,
    role: activeMember.role,
    full_name: activeMember.full_name,
    created_at: activeMember.created_at,
  } : null

  return (
    <AuthContext.Provider value={{ session, user, profile, loading: authLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
