// File Path: d:/Projects/Web/Universal POS/src/pages/auth/CreateStorePage.tsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Store, StoreMember } from '@/types'

const STORE_TYPES = [
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'ice_cream', name: 'Ice Cream', icon: '🍦' },
  { id: 'grocery', name: 'Grocery', icon: '🛒' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊' },
  { id: 'retail', name: 'Retail Store', icon: '🏪' },
  { id: 'clothing', name: 'Clothing Shop', icon: '👗' },
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'other', name: 'Other Business', icon: '🏬' },
]

const COLOR_PRESETS = [
  '#0f766e', // Teal
  '#e11d48', // Rose
  '#2563eb', // Blue
  '#d97706', // Amber
  '#16a34a', // Green
  '#7c3aed', // Purple
]

export default function CreateStorePage() {
  const navigate = useNavigate()
  const { user, setActiveStore } = useAuthStore()
  
  const [name, setName] = useState('')
  const [storeType, setStoreType] = useState('retail')
  const [currencySymbol, setCurrencySymbol] = useState('₹')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [themeColor, setThemeColor] = useState('#0f766e')
  const [customColor, setCustomColor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    const selectedColor = customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor) ? customColor : themeColor

    try {
      // 1. Insert into stores
      const { data: store, error: storeError } = await (supabase
        .from('stores') as any)
        .insert({
          name,
          store_type: storeType,
          currency_symbol: currencySymbol,
          phone: phone || null,
          address: address || null,
          theme_color: selectedColor,
        })
        .select()
        .single()

      if (storeError) throw storeError
      if (!store) throw new Error('Failed to create store record')

      // 2. Insert into store_members as 'owner'
      const { data: member, error: memberError } = await (supabase
        .from('store_members') as any)
        .insert({
          store_id: store.id,
          user_id: user.id,
          role: 'owner',
          full_name: user.user_metadata?.full_name || 'Owner',
        })
        .select()
        .single()

      if (memberError) throw memberError

      // 3. Set active store context and redirect
      setActiveStore(store as unknown as Store, member as unknown as StoreMember)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create store')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden py-10">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-2xl relative z-10 glass-card border-none shadow-2xl">
        <CardHeader className="space-y-3 pb-6 text-center pt-8">
          <div className="w-20 h-20 bg-primary mx-auto rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2">
            <span className="text-4xl">⚙️</span>
          </div>
          <CardTitle className="text-3xl font-poppins font-bold text-primary tracking-wide">Create Your Store</CardTitle>
          <CardDescription className="text-base">
            Set up details to initialize your new multi-tenant POS workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/90 rounded-md shadow-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Store Name *</label>
                <Input
                  placeholder="e.g. Universal Retail"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Currency Symbol *</label>
                <Input
                  placeholder="e.g. ₹, $, €"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Phone Number</label>
                <Input
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Address</label>
                <Input
                  placeholder="Store physical address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Store Type Selection Grid */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Business Type *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STORE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setStoreType(t.id)}
                    className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${
                      storeType === t.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-white/40 hover:bg-white/40'
                    }`}
                    disabled={loading}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme / Brand Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground font-poppins">Brand Theme Color</label>
              <div className="flex flex-wrap items-center gap-3">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      setThemeColor(color)
                      setCustomColor('')
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      themeColor === color && !customColor
                        ? 'border-foreground scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    disabled={loading}
                  />
                ))}
                
                <div className="flex items-center gap-2 border rounded-lg p-1 bg-white/50 border-white/40 shadow-inner">
                  <span className="text-xs text-muted-foreground pl-2 font-medium">Custom HEX</span>
                  <Input
                    type="text"
                    placeholder="#0f766e"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value)
                    }}
                    className="w-24 h-8 text-xs p-1"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg shadow-md font-medium mt-2 bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Creating Store Workspace...' : 'Initialize POS Store'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
