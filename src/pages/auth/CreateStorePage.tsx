// src/pages/auth/CreateStorePage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as zod from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Store, StoreMember } from '../../types'
import { toast } from '../../components/shared/Toast'
import { Loader2, Plus, Phone, MapPin, DollarSign } from 'lucide-react'

const storeTypes = [
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'ice_cream', name: 'Ice Cream', icon: '🍦' },
  { id: 'grocery', name: 'Grocery', icon: '🛒' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊' },
  { id: 'retail', name: 'Retail', icon: '🏪' },
  { id: 'clothing', name: 'Clothing', icon: '👗' },
  { id: 'electronics', name: 'Electronics', icon: '📱' },
  { id: 'other', name: 'Other', icon: '🏬' },
]

const themeColors = [
  { id: 'teal', value: '#0f766e', label: 'Teal' },
  { id: 'blue', value: '#1d4ed8', label: 'Blue' },
  { id: 'indigo', value: '#4338ca', label: 'Indigo' },
  { id: 'purple', value: '#7e22ce', label: 'Purple' },
  { id: 'emerald', value: '#047857', label: 'Emerald' },
  { id: 'rose', value: '#be123c', label: 'Rose' },
]

const storeSchema = zod.object({
  storeName: zod.string().min(2, 'Store name must be at least 2 characters'),
  storeType: zod.string().min(1, 'Please select a store type'),
  currencySymbol: zod.string().min(1, 'Currency symbol is required'),
  themeColor: zod.string().min(1, 'Theme color is required'),
  phone: zod.string().optional(),
  address: zod.string().optional(),
})

type StoreFormValues = zod.infer<typeof storeSchema>

export default function CreateStorePage() {
  const navigate = useNavigate()
  const { setActiveStore, setActiveMember } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeType: 'retail',
      currencySymbol: '₹',
      themeColor: '#0f766e',
      phone: '',
      address: '',
    },
  })

  const selectedStoreType = watch('storeType')
  const selectedThemeColor = watch('themeColor')

  const onSubmit = async (data: StoreFormValues) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: store, error: storeErr } = await supabase
        .from('stores')
        .insert({
          name: data.storeName,
          store_type: data.storeType,
          currency_symbol: data.currencySymbol,
          theme_color: data.themeColor,
          phone: data.phone,
          address: data.address
        })
        .select()
        .single()
      
      if (storeErr) throw storeErr

      const { error: memberErr } = await supabase
        .from('store_members')
        .insert({
          store_id: store.id,
          user_id: user.id,
          role: 'owner',
          full_name: user.user_metadata?.full_name ?? ''
        })
        
      if (memberErr) throw memberErr

      setActiveStore(store as Store)
      setActiveMember({ store_id: store.id, user_id: user.id, role: 'owner' } as StoreMember)
      toast.success('Store created!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create store')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] py-12 px-4 flex justify-center items-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-[#0f766e]/10 p-8 md:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 font-heading">Create Your Store</h2>
          <p className="text-gray-500 font-body mt-1">Configure your workspace and start billing customers</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">Store Name *</label>
            <input
              type="text"
              {...register('storeName')}
              className={`block w-full px-4 py-3 bg-gray-50 border ${
                errors.storeName ? 'border-red-300' : 'border-gray-200'
              } rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900`}
              placeholder="e.g. Tasty Treats, Super Grocery"
            />
            {errors.storeName && (
              <span className="text-xs text-red-500 mt-1 font-body block">{errors.storeName.message}</span>
            )}
          </div>

          {/* Store Type Cards */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 font-body font-medium">Store Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {storeTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setValue('storeType', type.id)}
                  className={`p-4 flex flex-col items-center justify-center rounded-2xl border text-center transition-all ${
                    selectedStoreType === type.id
                      ? 'border-[#0f766e] bg-[#0f766e]/5 ring-2 ring-[#0f766e]/20 text-[#0f766e]'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-3xl mb-1.5" role="img" aria-label={type.name}>
                    {type.icon}
                  </span>
                  <span className="text-sm font-medium font-body">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 font-body font-medium">Theme Color</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {themeColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setValue('themeColor', color.value)}
                  className={`py-3 px-2 flex flex-col items-center gap-1 rounded-xl border transition-all ${
                    selectedThemeColor === color.value
                      ? 'border-gray-900 bg-white ring-2 ring-gray-950/10'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full" style={{ backgroundColor: color.value }} />
                  <span className="text-xs font-medium font-body text-gray-600">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Currency + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">Currency Symbol *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  {...register('currencySymbol')}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
                  placeholder="₹, $, €, etc."
                />
              </div>
              {errors.currencySymbol && (
                <span className="text-xs text-red-500 mt-1 font-body block">{errors.currencySymbol.message}</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">Store Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  {...register('phone')}
                  className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">Store Address</label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 text-gray-400">
                <MapPin className="w-5 h-5" />
              </div>
              <textarea
                rows={3}
                {...register('address')}
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-body"
                placeholder="Full address of the shop"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-semibold font-body flex items-center justify-center gap-2 shadow-lg shadow-[#0f766e]/10 active:scale-[0.98] transition-transform disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Store <Plus className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
