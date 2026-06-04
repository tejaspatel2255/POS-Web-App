// src/pages/settings/Settings.tsx
import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { Store, StoreMember } from '../../types'
import { toast } from '../../components/shared/Toast'
import { canManageStaff } from '../../lib/permissions'
import {
  Store as StoreIcon,
  Sliders,
  Users,
  Plus,
  Mail,
  Shield,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  Copy,
  Info,
  X,
} from 'lucide-react'

const colorSwatches = [
  '#0f766e', // Teal
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#64748b', // Slate
]

export default function Settings() {
  const { activeStore, activeMember, user, setActiveStore } = useAuthStore()
  const storeId = activeStore?.id

  const role = activeMember?.role || 'cashier'
  const isOwner = role === 'owner'
  const isAdmin = role === 'admin'

  // Access Restriction Gate
  if (!canManageStaff(role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto font-body">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 font-heading">Access Denied</h3>
        <p className="text-gray-500 text-sm mt-2">
          Only store owners and administrators can configure settings and manage staff roster permissions.
        </p>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState<'profile' | 'staff'>('profile')
  const [loading, setLoading] = useState(false)

  // Store Profile States
  const [storeName, setStoreName] = useState('')
  const [tagline, setTagline] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('₹')
  const [taxRate, setTaxRate] = useState(0)
  const [receiptFooter, setReceiptFooter] = useState('')
  const [themeColor, setThemeColor] = useState('#0f766e')

  // Staff States
  const [members, setMembers] = useState<any[]>([])
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'cashier'>('cashier')

  // Load Settings
  useEffect(() => {
    if (!activeStore) return
    setStoreName(activeStore.name)
    setTagline(activeStore.tagline || '')
    setAddress(activeStore.address || '')
    setPhone(activeStore.phone || '')
    setCurrencySymbol(activeStore.currency_symbol || '₹')
    setTaxRate(activeStore.tax_rate || 0)
    setReceiptFooter(activeStore.receipt_footer || 'Thank you for visiting!')
    setThemeColor(activeStore.theme_color || '#0f766e')
    
    fetchMembers()
  }, [activeStore])

  const fetchMembers = async () => {
    if (!storeId) return
    try {
      const { data, error } = await supabase
        .from('store_members')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (e: any) {
      console.error(e)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) {
      toast.error('Only the store owner can edit configuration details')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('stores')
        .update({
          name: storeName,
          tagline: tagline || null,
          address: address || null,
          phone: phone || null,
          currency_symbol: currencySymbol,
          tax_rate: Number(taxRate),
          receipt_footer: receiptFooter,
          theme_color: themeColor,
        })
        .eq('id', storeId)
        .select()
        .single()

      if (error) throw error

      setActiveStore(data as Store)
      toast.success('Store settings saved successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save store profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isOwner) {
      toast.error('Only owners can invite staff')
      return
    }
    if (!inviteUserId.trim()) {
      toast.error('User ID UUID is required')
      return
    }

    try {
      const { data, error } = await supabase
        .from('store_members')
        .insert([{
          store_id: storeId,
          user_id: inviteUserId.trim(),
          role: inviteRole,
          full_name: `${inviteName} (${inviteEmail})`,
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      toast.success(`Successfully added staff member ${inviteName}!`)
      setInviteModalOpen(false)
      setInviteUserId('')
      setInviteName('')
      setInviteEmail('')
      fetchMembers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add staff member. Check if User ID exists.')
    }
  }

  const handleToggleMember = async (member: any) => {
    if (!isOwner) return
    if (member.user_id === user?.id) {
      toast.error('You cannot toggle your own active status')
      return
    }

    try {
      const { data, error } = await supabase
        .from('store_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id)
        .select()
        .single()

      if (error) throw error

      toast.success(`Member status updated successfully!`)
      fetchMembers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle member status')
    }
  }

  const handleRoleChange = async (member: any, nextRole: 'admin' | 'cashier') => {
    if (!isOwner) return
    if (member.user_id === user?.id) {
      toast.error('You cannot change your own role')
      return
    }

    try {
      const { error } = await supabase
        .from('store_members')
        .update({ role: nextRole })
        .eq('id', member.id)

      if (error) throw error

      toast.success('Member role updated')
      fetchMembers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update member role')
    }
  }

  const handleCopyUserId = () => {
    if (!user?.id) return
    navigator.clipboard.writeText(user.id)
    toast.success('Your User ID copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Header and Tab Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Settings</h2>
          <p className="text-gray-500 font-body text-sm mt-0.5">Configure store profiles and manage cashier access roster</p>
        </div>

        {/* Tab selection pills */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-150 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-body transition-all ${
              activeTab === 'profile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <StoreIcon className="w-4 h-4" />
            <span>Store Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-body transition-all ${
              activeTab === 'staff'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Access</span>
          </button>
        </div>
      </div>

      {/* Copy User ID helper card for cashiers */}
      <div className="bg-[#0f766e]/5 border border-[#0f766e]/15 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs font-semibold font-body text-gray-650">
        <div className="flex items-center gap-2.5">
          <Info className="w-5 h-5 text-[#0f766e] shrink-0" />
          <div>
            <span>Your Personal User ID: </span>
            <code className="bg-white px-2 py-0.5 rounded border border-gray-150 font-mono text-gray-950 font-bold select-all">
              {user?.id}
            </code>
          </div>
        </div>
        <button
          onClick={handleCopyUserId}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border hover:bg-gray-50 text-gray-700 rounded-lg active:scale-95 transition-transform"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
      </div>

      {/* Tab: Store Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
          <h3 className="text-base font-bold text-gray-900 font-heading">Brand & Business Profile</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                Store Name *
              </label>
              <input
                type="text"
                required
                disabled={!isOwner}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                Tagline
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 disabled:opacity-60"
                placeholder="e.g. Delicious Wood-fired Pizza"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                Address Location
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                Contact Phone
              </label>
              <input
                type="text"
                disabled={!isOwner}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-55 pt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                Currency Symbol *
              </label>
              <input
                type="text"
                required
                disabled={!isOwner}
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-bold disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                disabled={!isOwner}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
              Receipt Footer Note Text
            </label>
            <textarea
              rows={2}
              disabled={!isOwner}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-body disabled:opacity-60"
            />
          </div>

          {/* Color theme preset picker */}
          <div className="space-y-2 border-t border-gray-55 pt-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
              POS Work Environment Theme Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {colorSwatches.map((color) => (
                <button
                  key={color}
                  type="button"
                  disabled={!isOwner}
                  onClick={() => setThemeColor(color)}
                  className={`w-9 h-9 rounded-full border-2 transition-all active:scale-90 ${
                    themeColor === color ? 'border-gray-900 scale-105' : 'border-transparent hover:scale-102'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="flex items-center gap-1.5 ml-2 border bg-white rounded-xl px-2 h-9">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-6 h-6 border-0 rounded cursor-pointer p-0"
                  disabled={!isOwner}
                />
                <span className="text-xs uppercase font-mono font-semibold text-gray-500">{themeColor}</span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="flex justify-end pt-4 border-t border-gray-55">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-xs shadow-md shadow-[#0f766e]/10 active:scale-95 transition-transform flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab: Staff List & Add Modal */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-semibold font-body text-gray-500">
              Active Store Staff: <strong className="text-gray-800">{members.length}</strong>
            </span>
            {isOwner && (
              <button
                onClick={() => setInviteModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-xs shadow-md shadow-[#0f766e]/10 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" /> Invite Staff Member
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs font-body">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase font-bold tracking-wider text-gray-400 font-body bg-gray-50/50">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4 text-center w-36">Role Permission</th>
                  <th className="p-4 text-center w-28">Access State</th>
                  {isOwner && <th className="p-4 text-right w-36">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {members.map((member) => {
                  const isSelf = member.user_id === user?.id
                  const isOwnerMember = member.role === 'owner'

                  // Extract emails/names from simulated full_name formats "Name (email)"
                  let emailStr = 'No email associated'
                  let displayFullName = member.full_name || 'Staff Member'
                  if (member.full_name && member.full_name.includes('(') && member.full_name.includes(')')) {
                    const match = member.full_name.match(/\(([^)]+)\)/)
                    if (match) {
                      emailStr = match[1]
                      displayFullName = member.full_name.split('(')[0].trim()
                    }
                  } else if (isSelf) {
                    emailStr = user?.email || 'owner@universalpos.com'
                  }

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/20">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm">
                            {displayFullName} {isSelf && <span className="text-gray-450 italic text-[10px] ml-1">(You)</span>}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-0.5">{emailStr}</span>
                          <span className="text-[9px] text-gray-300 font-mono mt-0.5 select-all">{member.user_id}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {isOwner && !isOwnerMember && !isSelf ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member, e.target.value as any)}
                            className="bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg text-xs font-semibold outline-none focus:border-[#0f766e]"
                          >
                            <option value="admin">Admin</option>
                            <option value="cashier">Cashier</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider font-body ${
                            isOwnerMember
                              ? 'bg-purple-50 border-purple-200 text-purple-800'
                              : member.role === 'admin'
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${
                          member.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {member.is_active ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="p-4 text-right">
                          {!isOwnerMember && !isSelf && (
                            <button
                              onClick={() => handleToggleMember(member)}
                              className={`px-3 py-1.5 border font-bold text-[10px] rounded-xl active:scale-95 transition-transform ${
                                member.is_active
                                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {member.is_active ? 'Block Access' : 'Restore Access'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite/Add Staff Modal Dialog */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInviteModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-gray-100 p-6 animate-zoom-in">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 text-gray-455 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 font-heading mb-3">Onboard Store Staff</h3>

            {/* Hint alert */}
            <div className="p-3 bg-[#0f766e]/5 border border-[#0f766e]/15 rounded-2xl flex gap-2 text-[10px] text-gray-600 font-semibold mb-4 leading-normal">
              <Shield className="w-4 h-4 text-[#0f766e] shrink-0" />
              <span>
                To grant cashier access, staff must register their account first. Paste their personal User ID (copied from their own settings panel) below.
              </span>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Staff Display Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                  placeholder="e.g. John Cashier"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
                  placeholder="e.g. john@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Staff User ID (UUID) *
                </label>
                <input
                  type="text"
                  required
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-mono"
                  placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Access Permission Level
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-colors outline-none text-gray-950 font-semibold"
                >
                  <option value="cashier">Cashier (Checkouts only)</option>
                  <option value="admin">Admin (Manage Catalog & Staff)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold font-body text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-xs transition-colors shadow-md"
                >
                  Invite Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
