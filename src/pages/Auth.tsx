import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function Auth() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        if (data.user) {
          // Create user profile in profiles table
          const { error: profileError } = await (supabase
            .from('profiles') as any)
            .insert({
              id: data.user.id,
              role: 'cashier', // Default new signups to cashier
              full_name: fullName,
            })
          if (profileError) {
            console.error('Failed to create profile record:', profileError)
            // We still proceed, but warn that profile creation requires RLS insert policy
          }
        }
        setSuccess('Account created successfully! You can now sign in.')
        setIsSignUp(false)
        setPassword('')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-md relative z-10 glass-card border-none shadow-2xl">
        <CardHeader className="space-y-3 pb-6 text-center pt-8">
          <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2 animate-bounce-slow">
            <span className="text-4xl">🍦</span>
          </div>
          <CardTitle className="text-3xl font-poppins font-bold text-primary tracking-wide">Savaliya POS</CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? 'Create a cashier or admin account' : 'Sign in to access the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {isSignUp && (
                <div className="space-y-1">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 bg-white/60 border-white/40 focus:border-primary shadow-sm"
                  />
                </div>
              )}
              <div className="space-y-1">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/60 border-white/40 focus:border-primary shadow-sm"
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
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md shadow-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 text-sm text-teal-800 bg-teal-100 border border-teal-200 rounded-md shadow-sm">
                {success}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg shadow-md font-medium mt-2 bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading 
                ? (isSignUp ? 'Creating account...' : 'Signing in...') 
                : (isSignUp ? 'Sign Up' : 'Sign In')
              }
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setSuccess(null)
                }}
                className="text-sm font-semibold text-primary hover:underline transition-all"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
