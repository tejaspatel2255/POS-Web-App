// File Path: d:/Projects/Web/Universal POS/src/pages/auth/LoginPage.tsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Store, StoreMember } from '@/types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setActiveStore, setActiveMember } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Sign in with password
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError
      if (!user) throw new Error('No user returned from login')

      setUser(user)

      // 2. Query store memberships
      const { data: members, error: membershipError } = await (supabase
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
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (membershipError) throw membershipError

      // 3. Route user according to membership count
      if (!members || members.length === 0) {
        setActiveStore(null)
        setActiveMember(null)
        navigate('/create-store')
      } else if (members.length === 1) {
        const { store, ...memberData } = members[0] as any
        setActiveStore(store as unknown as Store)
        setActiveMember(memberData as unknown as StoreMember)
        navigate('/dashboard')
      } else {
        // Clear active store and let them choose
        setActiveStore(null)
        setActiveMember(null)
        navigate('/select-store')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md relative z-10 glass-card border-none shadow-2xl">
        <CardHeader className="space-y-3 pb-6 text-center pt-8">
          <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2 animate-bounce-slow">
            <span className="text-4xl">🏪</span>
          </div>
          <CardTitle className="text-3xl font-poppins font-bold text-primary tracking-wide">Universal POS</CardTitle>
          <CardDescription className="text-base">
            Sign in to access your store dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/60 border-white/40 focus:border-primary shadow-sm"
                  disabled={loading}
                />
              </div>
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-white/60 border-white/40 focus:border-primary shadow-sm"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md shadow-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg shadow-md font-medium mt-2 bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary hover:underline transition-all">
                  Sign Up
                </Link>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
