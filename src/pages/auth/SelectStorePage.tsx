// File Path: d:/Projects/Web/Universal POS/src/pages/auth/SelectStorePage.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Store, StoreMember } from '@/types'

const STORE_TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  ice_cream: '🍦',
  grocery: '🛒',
  pharmacy: '💊',
  retail: '🏪',
  clothing: '👗',
  electronics: '📱',
  other: '🏬',
}

interface MemberWithStore {
  id: string
  store_id: string
  user_id: string
  role: 'owner' | 'admin' | 'cashier'
  full_name: string | null
  is_active: boolean
  created_at: string
  store: Store
}

export default function SelectStorePage() {
  const navigate = useNavigate()
  const { user, setActiveStore, setActiveMember } = useAuthStore()
  const [memberships, setMemberships] = useState<MemberWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchMemberships = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('store_members')
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
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (fetchError) throw fetchError
        setMemberships((data || []) as unknown as MemberWithStore[])
      } catch (err: any) {
        setError(err.message || 'Failed to fetch store memberships')
      } finally {
        setLoading(false)
      }
    }

    fetchMemberships()
  }, [user, navigate])

  const handleSelectStore = (membership: MemberWithStore) => {
    const { store, ...memberData } = membership
    setActiveStore(store)
    setActiveMember(memberData as unknown as StoreMember)
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden py-10">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-2xl relative z-10 glass-card border-none shadow-2xl">
        <CardHeader className="space-y-3 pb-6 text-center pt-8">
          <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2">
            <span className="text-4xl">🏢</span>
          </div>
          <CardTitle className="text-3xl font-poppins font-bold text-primary tracking-wide">Select Your Store</CardTitle>
          <CardDescription className="text-base">
            Choose a store workspace to manage, or set up a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md shadow-sm">
              {error}
            </div>
          )}

          {memberships.length === 0 ? (
            <div className="text-center py-6 space-y-4">
              <p className="text-muted-foreground">You are not registered in any stores yet.</p>
              <Button onClick={() => navigate('/create-store')} className="bg-primary hover:bg-primary/90">
                Create New Store
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                {memberships.map((m) => {
                  const storeIcon = STORE_TYPE_ICONS[m.store.store_type] || '🏬'
                  const roleColors: Record<string, string> = {
                    owner: 'bg-red-100 text-red-800 border-red-200',
                    admin: 'bg-blue-100 text-blue-800 border-blue-200',
                    cashier: 'bg-green-100 text-green-800 border-green-200',
                  }
                  
                  return (
                    <Card 
                      key={m.id} 
                      className="border-white/40 bg-white/40 hover:bg-white/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <span className="text-3xl p-1 bg-white/80 rounded-md shadow-sm">{storeIcon}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleColors[m.role] || 'bg-gray-100 text-gray-800'}`}>
                            {m.role.toUpperCase()}
                          </span>
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground mt-2 truncate">
                          {m.store.name}
                        </CardTitle>
                        {m.store.tagline && (
                          <p className="text-xs text-muted-foreground truncate">{m.store.tagline}</p>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Button 
                          onClick={() => handleSelectStore(m)} 
                          className="w-full mt-2 bg-primary hover:bg-primary/90 text-sm h-9"
                        >
                          Enter Store
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/20">
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    navigate('/login')
                  }}
                  className="border-white/40 hover:bg-white/20"
                >
                  Sign Out
                </Button>
                <Button 
                  onClick={() => navigate('/create-store')} 
                  className="bg-primary hover:bg-primary/90"
                >
                  Create New Store
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
