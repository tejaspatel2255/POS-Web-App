// src/pages/auth/SelectStorePage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Store, StoreMember } from '../../types'
import { toast } from '../../components/shared/Toast'
import { Loader2, Plus, ArrowRight, Store as StoreIcon } from 'lucide-react'

const storeTypes = [
  { id: 'restaurant', icon: '🍽️' },
  { id: 'ice_cream', icon: '🍦' },
  { id: 'grocery', icon: '🛒' },
  { id: 'pharmacy', icon: '💊' },
  { id: 'retail', icon: '🏪' },
  { id: 'clothing', icon: '👗' },
  { id: 'electronics', icon: '📱' },
  { id: 'other', icon: '🏬' },
]

export default function SelectStorePage() {
  const navigate = useNavigate()
  const { user, setActiveStore, setActiveMember } = useAuthStore()
  const [memberships, setMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchMemberships = async () => {
      try {
        const { data, error } = await supabase
          .from('store_members')
          .select('*, stores(*)')
          .eq('user_id', user.id)
          .eq('is_active', true) as any

        if (error) throw error
        setMemberships(data || [])
      } catch (err: any) {
        toast.error(err.message || 'Failed to load stores')
      } finally {
        setLoading(false)
      }
    }

    fetchMemberships()
  }, [user, navigate])

  const handleSelect = (member: any) => {
    setActiveStore(member.stores as Store)
    setActiveMember(member as StoreMember)
    toast.success(`Welcome to ${member.stores.name}`)
    navigate('/dashboard')
  }

  const getStoreIcon = (type: string) => {
    const found = storeTypes.find((t) => t.id === type)
    return found ? found.icon : '🏬'
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbf5] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0f766e]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffbf5] py-16 px-4 flex justify-center items-center">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 font-heading">Choose Your Workspace</h2>
          <p className="text-gray-500 font-body mt-1">Select a store to launch the POS dashboard</p>
        </div>

        {memberships.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#0f766e]/10 rounded-2xl flex items-center justify-center text-[#0f766e] mx-auto mb-4">
              <StoreIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-heading">No Stores Found</h3>
            <p className="text-gray-500 text-sm font-body mt-2 mb-6">
              You aren't associated with any stores yet. Create your first store to get started!
            </p>
            <button
              onClick={() => navigate('/create-store')}
              className="py-3 px-6 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-medium font-body flex items-center justify-center gap-2 mx-auto shadow-md"
            >
              Create New Store <Plus className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {memberships.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md flex items-center justify-between hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl bg-gray-50 p-3 rounded-2xl border border-gray-100 block">
                      {getStoreIcon(member.stores.store_type)}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 font-heading">{member.stores.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-500 font-body">Role:</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-semibold font-body uppercase tracking-wider ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelect(member)}
                    className="p-3 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-medium font-body flex items-center justify-center gap-1 hover:gap-2 transition-all active:scale-[0.98]"
                  >
                    Enter <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={() => navigate('/create-store')}
                className="py-3 px-6 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-xl font-semibold font-body flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                Create New Store <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
