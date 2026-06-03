// File Path: d:/Projects/Web/Universal POS/src/pages/auth/RegisterPage.tsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // 1. Sign up with Supabase Auth including metadata
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (signUpError) throw signUpError
      if (!user) throw new Error('Failed to create account')

      // 2. Save user in AuthStore
      setUser(user)

      // 3. Redirect to /create-store since new users don't have stores
      navigate('/create-store')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
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
            <span className="text-4xl">🚀</span>
          </div>
          <CardTitle className="text-3xl font-poppins font-bold text-primary tracking-wide">Get Started</CardTitle>
          <CardDescription className="text-base">
            Create an account to build your business POS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 bg-white/60 border-white/40 focus:border-primary shadow-sm"
                  disabled={loading}
                />
              </div>
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
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <div className="text-center mt-4">
              <span className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline transition-all">
                  Sign In
                </Link>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
