// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Store, StoreMember } from '../../types'
import { Store as StoreIcon, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { toast } from '../../components/shared/Toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setActiveStore, setActiveMember } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authErr) throw authErr

      if (authData.user) {
        setUser(authData.user)

        // Fetch memberships
        const { data: memberships, error: memErr } = await supabase
          .from('store_members')
          .select('*, stores(*)')
          .eq('user_id', authData.user.id)
          .eq('is_active', true) as any

        if (memErr) throw memErr

        if (!memberships || memberships.length === 0) {
          toast.success('Login successful! Create your store now.')
          navigate('/create-store')
        } else if (memberships.length === 1) {
          setActiveStore(memberships[0].stores as Store)
          setActiveMember(memberships[0] as StoreMember)
          toast.success(`Welcome back to ${memberships[0].stores.name}!`)
          navigate('/dashboard')
        } else {
          toast.success('Login successful! Select a store to manage.')
          navigate('/select-store')
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in. Please check your credentials.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#0f766e]/10 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0f766e]/10 flex items-center justify-center text-[#0f766e] mb-4">
              <StoreIcon className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-heading">Universal POS</h2>
            <p className="text-gray-500 text-sm mt-1 text-center font-body">
              The all-in-one POS solution for your business
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-body">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
                  placeholder="name@store.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-body">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-medium font-body flex items-center justify-center gap-2 shadow-lg shadow-[#0f766e]/10 active:scale-[0.98] transition-transform disabled:opacity-75 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex justify-center">
          <p className="text-sm text-gray-600 font-body">
            New here?{' '}
            <Link to="/register" className="font-semibold text-[#0f766e] hover:text-[#0d635c] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
