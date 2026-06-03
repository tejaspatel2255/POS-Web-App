// File Path: d:/Projects/Web/Universal POS/src/components/layout/AppShell.tsx

import { useState, useEffect } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { Menu, X, ChevronDown, Plus, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '../ui/use-toast'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import OfflineBanner from '@/components/shared/OfflineBanner'
import type { Store, StoreMember } from '@/types'

export default function AppShell() {
  const navigate = useNavigate()
  const { user, activeStore, activeMember } = useAuth()
  const { setActiveStore } = useAuthStore()
  const { setStoreId } = useCartStore()
  const { toasts } = useToast()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false)
  const [memberships, setMemberships] = useState<any[]>([])

  // Load and inject the store's custom brand color dynamically
  useEffect(() => {
    if (activeStore?.theme_color) {
      // Set CSS custom property dynamically
      document.documentElement.style.setProperty('--primary', activeStore.theme_color)
      document.documentElement.style.setProperty('--ring', activeStore.theme_color)
      // Sync the storeId in the cartStore
      setStoreId(activeStore.id)
    } else {
      // Fallback to default teal
      document.documentElement.style.setProperty('--primary', '#0f766e')
      document.documentElement.style.setProperty('--ring', '#0f766e')
    }
  }, [activeStore, setStoreId])

  // Query store list for switcher dropdown
  useEffect(() => {
    if (!user) return

    const fetchStores = async () => {
      try {
        const { data } = await supabase
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

        if (data) setMemberships(data)
      } catch (err) {
        console.error('Error fetching store list for switcher:', err)
      }
    }

    const runFetch = async () => {
      await fetchStores()
    }
    runFetch()
  }, [user])

  const handleSwitchStore = (m: any) => {
    const { store, ...memberData } = m
    setActiveStore(store as Store, memberData as StoreMember)
    setIsStoreDropdownOpen(false)
    setIsSidebarOpen(false)
    // Clear and reload dashboard/billing to apply new store constraints
    navigate('/')
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      {/* Offline Status Alert */}
      <OfflineBanner />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Desktop Sidebar (persistent >1024px) */}
        <div className="hidden lg:flex flex-shrink-0 h-full">
          <Sidebar />
        </div>

        {/* Collapsible Mobile/Tablet Drawer Sidebar (<=1024px) */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar drawer content */}
            <div className="relative flex flex-col w-64 h-full bg-primary text-primary-foreground transform transition-transform duration-300">
              <div className="absolute top-4 right-4 z-50">
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Header Panel */}
          <header className="h-16 bg-white/70 backdrop-blur-md border-b flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 sticky top-0">
            
            {/* Left Side: Mobile Menu Trigger & Store branding */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-white/40 hover:bg-white/50 text-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Store Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/50 bg-white/50 hover:bg-white/80 transition-all font-semibold text-sm shadow-sm"
                >
                  <span className="truncate max-w-[120px] sm:max-w-[200px]">
                    {activeStore?.name || 'Select Store'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>

                {isStoreDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsStoreDropdownOpen(false)} 
                    />
                    <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-muted/50 p-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3 py-1.5 border-b border-muted/30">
                        Switch Store Workspace
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto py-1 space-y-1">
                        {memberships.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleSwitchStore(m)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                              activeStore?.id === m.store_id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/80 text-foreground'
                            }`}
                          >
                            <span className="truncate">{m.store.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-medium border text-muted-foreground uppercase">
                              {m.role}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-muted/30 pt-2 mt-1">
                        <Link
                          to="/create-store"
                          onClick={() => setIsStoreDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-all text-center border border-primary/20 bg-primary/5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create New Store
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Side: Logged-in Staff Context & Role Badge */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-white px-3 py-1.5 rounded-full border shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Role: {activeMember?.role || 'Guest'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground bg-white/50 px-3 py-1.5 rounded-full border shadow-sm border-white/50">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium max-w-[100px] truncate capitalize">
                  {activeMember?.full_name || 'Staff'}
                </span>
              </div>
            </div>

          </header>
          
          {/* Main App Page Outlet */}
          <main className="flex-1 overflow-auto bg-background/50 relative p-4 lg:p-8">
            <Outlet />
          </main>
          
          {/* Mobile/Tablet Bottom Nav (hidden >1024px) */}
          <div className="lg:hidden">
            <BottomNav />
          </div>
        </div>

      </div>

      {/* Floating Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-lg border text-xs font-semibold pointer-events-auto transition-all animate-in slide-in-from-right-5 duration-200 ${
              t.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground border-destructive'
                : 'bg-white text-foreground border-muted'
            }`}
          >
            <div className="font-bold">{t.title}</div>
            {t.description && <div className="text-[10px] text-muted-foreground mt-0.5">{t.description}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
