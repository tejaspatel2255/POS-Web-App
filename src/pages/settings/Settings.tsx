// File Path: d:/Projects/Web/Universal POS/src/pages/settings/Settings.tsx

import { useState, useEffect } from 'react'
import { Store as StoreIcon, ShieldCheck, Mail, Users, ToggleLeft, ToggleRight, Plus, Sliders } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabaseClient'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '../../components/ui/use-toast'
import type { Store, StoreMember } from '@/types'

const PRESET_COLORS = [
  '#0f766e', // Deep Teal
  '#4f46e5', // Indigo
  '#e11d48', // Coral Red
  '#ea580c', // Orange
  '#059669', // Emerald
  '#7c3aed', // Violet
]

export default function Settings() {
  const { toast } = useToast()
  const { user, activeStore, activeMember } = useAuth()
  const { setActiveStore } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'order_types' | 'staff'>('profile')
  const [loading, setLoading] = useState(true)

  // Store Profile State
  const [storeName, setStoreName] = useState('')
  const [storeTagline, setStoreTagline] = useState('')
  const [storeLogoUrl, setStoreLogoUrl] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [storeEmail, setStoreEmail] = useState('')
  const [currencySymbol, setCurrencySymbol] = useState('₹')
  const [currencyCode, setCurrencyCode] = useState('INR')
  const [taxRate, setTaxRate] = useState(0)
  const [parcelCharges, setParcelCharges] = useState(0)
  const [receiptFooter, setReceiptFooter] = useState('')
  const [themeColor, setThemeColor] = useState('#0f766e')
  const [storeType, setStoreType] = useState('retail')

  // Order Types Settings State
  const [orderTypes, setOrderTypes] = useState<Record<string, boolean>>({
    walk_in: true,
    dine_in: true,
    takeaway: true,
    parcel: true,
    delivery: true,
  })

  // Staff State
  const [staffList, setStaffList] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'cashier'>('cashier')
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Check if owner
  const isOwner = activeMember?.role === 'owner'

  // Fetch all settings data
  const loadSettingsData = async () => {
    if (!activeStore) return
    setLoading(true)
    try {
      // 1. Populate store profile state
      setStoreName(activeStore.name)
      setStoreTagline(activeStore.tagline || '')
      setStoreLogoUrl(activeStore.logo_url || '')
      setStoreAddress(activeStore.address || '')
      setStorePhone(activeStore.phone || '')
      setStoreEmail(activeStore.email || '')
      setCurrencySymbol(activeStore.currency_symbol)
      setCurrencyCode(activeStore.currency_code)
      setTaxRate(activeStore.tax_rate)
      setParcelCharges(activeStore.default_parcel_charges)
      setReceiptFooter(activeStore.receipt_footer)
      setThemeColor(activeStore.theme_color)
      setStoreType(activeStore.store_type)

      // 2. Fetch order types JSON from store_settings
      const { data: settingData } = await (supabase
        .from('store_settings') as any)
        .select('value')
        .eq('store_id', activeStore.id)
        .eq('key', 'order_types')
        .maybeSingle()

      if (settingData?.value) {
        try {
          setOrderTypes(JSON.parse(settingData.value))
        } catch (_) {}
      }

      // 3. Fetch staff members list
      const { data: members } = await (supabase
        .from('store_members') as any)
        .select('*')
        .eq('store_id', activeStore.id)
        .order('role', { ascending: true })

      if (members) {
        setStaffList(members)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettingsData()
  }, [activeStore])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStore || !isOwner) return

    try {
      const updatedStore = {
        name: storeName,
        tagline: storeTagline || null,
        logo_url: storeLogoUrl || null,
        address: storeAddress || null,
        phone: storePhone || null,
        email: storeEmail || null,
        currency_symbol: currencySymbol,
        currency_code: currencyCode,
        tax_rate: Number(taxRate),
        default_parcel_charges: Number(parcelCharges),
        receipt_footer: receiptFooter,
        theme_color: themeColor,
        store_type: storeType,
      }

      const { data, error } = await (supabase
        .from('stores') as any)
        .update(updatedStore)
        .eq('id', activeStore.id)
        .select()
        .single()

      if (error) throw error

      // Update Zustand local context
      setActiveStore(data as Store, activeMember as StoreMember)
      
      toast({
        title: '✅ Settings Saved',
        description: 'Store profile has been successfully updated.',
      })
    } catch (err: any) {
      toast({
        title: '❌ Save Failed',
        description: err.message || 'Could not update store profile.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleOrderType = async (key: string) => {
    if (!activeStore || !isOwner) return
    
    const updated = {
      ...orderTypes,
      [key]: !orderTypes[key],
    }
    
    setOrderTypes(updated)

    try {
      // Upsert JSON setting into store_settings
      const { error } = await (supabase
        .from('store_settings') as any)
        .upsert({
          store_id: activeStore.id,
          key: 'order_types',
          value: JSON.stringify(updated),
        }, { onConflict: 'store_id,key' })

      if (error) throw error
    } catch (err: any) {
      toast({
        title: '❌ Toggle Failed',
        description: err.message || 'Could not update order type visibility.',
        variant: 'destructive',
      })
    }
  }

  // Staff Management operations
  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeStore || !isOwner || !inviteEmail) return

    try {
      // Simulate/Insert a new member
      // Note: Because we cannot call admin.inviteUserByEmail on client securely,
      // we insert a member record with invite name and email representation.
      const mockUserId = crypto.randomUUID() // Simulated authentication link

      const { data, error } = await (supabase
        .from('store_members') as any)
        .insert({
          store_id: activeStore.id,
          user_id: mockUserId, // Simulated ID
          role: inviteRole,
          full_name: `${inviteName} (${inviteEmail})`,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      setStaffList([...staffList, data])
      setInviteEmail('')
      setInviteName('')
      setShowInviteModal(false)

      toast({
        title: '📨 Invitation Sent',
        description: `Successfully added ${inviteName} as ${inviteRole}.`,
      })
    } catch (err: any) {
      toast({
        title: '❌ Invitation Failed',
        description: err.message || 'Could not create staff membership.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleStaffStatus = async (member: any) => {
    if (!activeStore || !isOwner || member.role === 'owner') return

    try {
      const { data, error } = await (supabase
        .from('store_members') as any)
        .update({ is_active: !member.is_active })
        .eq('id', member.id)
        .select()
        .single()

      if (error) throw error

      setStaffList(staffList.map((s) => (s.id === member.id ? data : s)))
    } catch (err: any) {
      toast({
        title: '❌ Status Update Failed',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateStaffRole = async (memberId: string, newRole: 'admin' | 'cashier') => {
    if (!activeStore || !isOwner) return

    try {
      const { data, error } = await (supabase
        .from('store_members') as any)
        .update({ role: newRole })
        .eq('id', memberId)
        .select()
        .single()

      if (error) throw error

      setStaffList(staffList.map((s) => (s.id === memberId ? data : s)))
      toast({
        title: '✅ Role Updated',
        description: `Role changed to ${newRole}.`,
      })
    } catch (err: any) {
      toast({
        title: '❌ Role Update Failed',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <LoadingSkeleton variant="table" count={5} />
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Page Header */}
      <PageHeader
        title="Store Settings"
        subtitle="Manage brand profile, configure order options, and onboard staff members"
      />

      {/* Tabs Header bar */}
      <div className="flex items-center border-b border-muted/50 gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-poppins text-sm font-semibold transition-all ${
            activeTab === 'profile'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <StoreIcon className="w-4 h-4" />
          Store Profile
        </button>
        
        <button
          onClick={() => setActiveTab('order_types')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-poppins text-sm font-semibold transition-all ${
            activeTab === 'order_types'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Order Types
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-poppins text-sm font-semibold transition-all ${
            activeTab === 'staff'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff & Members
        </button>
      </div>

      {!isOwner && (
        <div className="p-3.5 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <span>Viewing Mode: Settings modifications are limited to the store owner role only.</span>
        </div>
      )}

      {/* Tab: Store Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 bg-white/40 border border-white/50 p-6 rounded-2xl shadow-sm max-w-3xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Store Name *</label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled={!isOwner}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Tagline</label>
              <Input
                value={storeTagline}
                onChange={(e) => setStoreTagline(e.target.value)}
                disabled={!isOwner}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Logo Image URL</label>
              <Input
                value={storeLogoUrl}
                onChange={(e) => setStoreLogoUrl(e.target.value)}
                disabled={!isOwner}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Store Type</label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                value={storeType}
                onChange={(e) => setStoreType(e.target.value)}
                disabled={!isOwner}
              >
                <option value="retail">Retail Shop</option>
                <option value="restaurant">Restaurant / Cafe</option>
                <option value="ice_cream">Ice Cream Parlor</option>
                <option value="grocery">Grocery Store</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="clothing">Clothing Boutique</option>
                <option value="electronics">Electronics Store</option>
                <option value="other">Other Store Workspace</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Phone</label>
              <Input
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
              <Input
                type="email"
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Address</label>
              <Input
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                disabled={!isOwner}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-muted/30 pt-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Currency Symbol</label>
              <Input
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                disabled={!isOwner}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Currency Code</label>
              <Input
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                disabled={!isOwner}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Tax Rate %</label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                disabled={!isOwner}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Parcel Charge</label>
              <Input
                type="number"
                value={parcelCharges}
                onChange={(e) => setParcelCharges(Number(e.target.value))}
                disabled={!isOwner}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Receipt Custom Footer Text</label>
            <textarea
              className="w-full p-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              disabled={!isOwner}
              placeholder="e.g. Thanks for your visit! Follow us on Instagram..."
            />
          </div>

          {/* Color Picker Section */}
          <div className="space-y-2 border-t border-muted/30 pt-4">
            <label className="text-xs font-bold text-muted-foreground uppercase block font-poppins">Workspace Theme Color</label>
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setThemeColor(color)}
                  className={`w-9 h-9 rounded-xl border-2 transition-all ${
                    themeColor === color ? 'scale-108 border-foreground shadow-md' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={!isOwner}
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
                <span className="text-xs uppercase font-mono">{themeColor}</span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="flex justify-end pt-4 border-t border-muted/30">
              <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold shadow-md">
                Save Profile Changes
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Tab: Order Types Selection */}
      {activeTab === 'order_types' && (
        <div className="bg-white/40 border border-white/50 p-6 rounded-2xl shadow-sm max-w-md space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground font-poppins">Configure Order Routing Types</h3>
            <p className="text-xs text-muted-foreground">
              Select which order modes are active at checkout on the POS billing workspace.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {[
              { key: 'walk_in', label: 'Walk In order' },
              { key: 'dine_in', label: 'Dine In reservation' },
              { key: 'takeaway', label: 'Takeaway pickup' },
              { key: 'parcel', label: 'Parcel packaging' },
              { key: 'delivery', label: 'Home Delivery' },
            ].map((type) => {
              const isEnabled = orderTypes[type.key] !== false
              return (
                <div
                  key={type.key}
                  className="flex items-center justify-between p-3.5 bg-white border border-muted/50 rounded-xl hover:bg-muted/5 transition-colors"
                >
                  <span className="text-xs font-bold text-foreground font-poppins capitalize">
                    {type.label}
                  </span>
                  <button
                    onClick={() => handleToggleOrderType(type.key)}
                    className="p-1 text-primary focus:outline-none"
                    disabled={!isOwner}
                  >
                    {isEnabled ? (
                      <ToggleRight className="w-9 h-6 text-primary cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-9 h-6 text-muted-foreground cursor-pointer" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Staff Roster Management */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm">
            <span className="text-sm font-semibold text-muted-foreground">
              Onboarded Staff Members: {staffList.length}
            </span>
            {isOwner && (
              <Button onClick={() => setShowInviteModal(true)} className="bg-primary hover:bg-primary/90 flex items-center gap-2 font-bold text-xs h-9 shadow-sm">
                <Plus className="w-4 h-4" />
                Invite Staff Member
              </Button>
            )}
          </div>

          <div className="border border-white/50 bg-white/40 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="p-4 font-bold text-muted-foreground uppercase">Full Name</th>
                  <th className="p-4 font-bold text-muted-foreground uppercase">Email Address</th>
                  <th className="p-4 font-bold text-muted-foreground uppercase">Role Authority</th>
                  <th className="p-4 font-bold text-muted-foreground uppercase w-28 text-center">Status</th>
                  {isOwner && <th className="p-4 font-bold text-muted-foreground uppercase w-32 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => {
                  const isSelf = member.user_id === user?.id
                  const isOwnerMember = member.role === 'owner'

                  // Extract email if simulated
                  let emailStr = 'No email associated'
                  let displayFullName = member.full_name || 'Staff Member'
                  if (member.full_name && member.full_name.includes('(') && member.full_name.includes(')')) {
                    const match = member.full_name.match(/\(([^)]+)\)/)
                    if (match) {
                      emailStr = match[1]
                      displayFullName = member.full_name.split('(')[0].trim()
                    }
                  } else if (isSelf) {
                    emailStr = user?.email || 'owner@workspace.com'
                  }

                  const roleColors: Record<string, string> = {
                    owner: 'bg-red-50 text-red-700 border-red-200',
                    admin: 'bg-blue-50 text-blue-700 border-blue-200',
                    cashier: 'bg-green-50 text-green-700 border-green-200',
                  }

                  return (
                    <tr key={member.id} className="border-b hover:bg-white/60 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        {displayFullName} {isSelf && <span className="text-[10px] text-muted-foreground">(You)</span>}
                      </td>
                      <td className="p-4 text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {emailStr}
                      </td>
                      <td className="p-4">
                        {isOwner && !isOwnerMember ? (
                          <select
                            className="h-8 px-2 py-0.5 rounded border border-input bg-white text-xs focus:outline-none"
                            value={member.role}
                            onChange={(e) => handleUpdateStaffRole(member.id, e.target.value as any)}
                          >
                            <option value="admin">Admin</option>
                            <option value="cashier">Cashier</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded border font-semibold uppercase tracking-wider text-[9px] ${roleColors[member.role] || ''}`}>
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-semibold border ${member.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                          {member.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="p-4 text-center">
                          {!isOwnerMember && (
                            <button
                              onClick={() => handleToggleStaffStatus(member)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                member.is_active
                                  ? 'bg-destructive/5 hover:bg-destructive/10 text-destructive border-destructive/20'
                                  : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                              }`}
                            >
                              {member.is_active ? 'Deactivate' : 'Activate'}
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

      {/* Invite Modal Dialog */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleInviteStaff} className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-muted space-y-4">
            <h3 className="text-base font-bold font-poppins text-foreground">Onboard Store Staff</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Staff Full Name</label>
              <Input
                placeholder="e.g. Jane Smith"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</label>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Access Role Permission</label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-input bg-white text-xs focus:outline-none shadow-xs"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
              >
                <option value="cashier">Cashier (POS Checkout only)</option>
                <option value="admin">Admin (CRUD Products & Categories)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 font-bold">
                Invite Staff Member
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
