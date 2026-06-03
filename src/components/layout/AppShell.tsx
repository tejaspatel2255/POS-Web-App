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
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Track online/offline status reactively
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

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
        
        {/* Tablet/Desktop Sidebar (persistent on md and above) */}
        {/* Collapses to icon-only (w-12 / 48px) on md, hovers/taps to expand to w-64 (240px) as absolute overlay. */}
        {/* On desktop (lg), always expanded to w-64. */}
        {/* Completely hidden on mobile. */}
        <div className="hidden md:block lg:w-64 md:w-12 flex-shrink-0 h-full relative z-20 group/sidebar transition-all duration-300">
          <div className="absolute left-0 top-0 bottom-0 w-12 lg:w-64 md:group-hover/sidebar:w-64 md:group-hover/sidebar:shadow-2xl transition-all duration-300 h-full flex">
            <Sidebar />
          </div>
        </div>

        {/* Collapsible Mobile Drawer Sidebar (<=768px / md) */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
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
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
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
          <header className="h-16 bg-white/70 backdrop-blur-md border-b flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 sticky top-0 w-full overflow-hidden">
            
            {/* Left Side: Mobile Menu Trigger (only on mobile <=768px, triggers drawer) & Store branding switcher */}
            <div className="flex items-center gap-2 max-w-[50%] sm:max-w-[70%] min-w-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 rounded-xl border border-white/40 hover:bg-white/50 text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Store Switcher Dropdown */}
              <div className="relative min-w-0">
                <button
                  onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/50 bg-white/50 hover:bg-white/80 transition-all font-semibold text-xs sm:text-sm shadow-sm min-h-[44px] truncate min-w-0"
                >
                  <span className="truncate max-w-[80px] xs:max-w-[120px] sm:max-w-[200px]">
                    {activeStore?.name || 'Select Store'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  {!isOnline && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold uppercase tracking-wider scale-90 sm:scale-100 origin-left">
                      Offline
                    </span>
                  )}
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
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors min-h-[44px] ${
                              activeStore?.id === m.store_id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/80 text-foreground'
                            }`}
                          >
                            <span className="truncate">{m.store.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-medium border text-muted-foreground uppercase flex-shrink-0 ml-2">
                              {m.role}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-muted/30 pt-2 mt-1">
                        <Link
                          to="/create-store"
                          onClick={() => setIsStoreDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-all text-center border border-primary/20 bg-primary/5 min-h-[44px]"
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
            <div className="flex items-center gap-2 sm:gap-4 ml-auto flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-white px-3 py-1.5 rounded-full border shadow-sm min-h-[44px]">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Role: {activeMember?.role || 'Guest'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground bg-white/50 px-2.5 py-1.5 rounded-full border shadow-sm border-white/50 min-h-[44px] max-w-[120px] sm:max-w-[160px] truncate">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium truncate capitalize">
                  {activeMember?.full_name?.split(' ')[0] || 'Staff'}
                </span>
              </div>
            </div>

          </header>
          
          {/* Main App Page Outlet */}
          {/* Added extra bottom padding (pb-24) on mobile to avoid overlapping with BottomNav */}
          <main className="flex-1 overflow-auto bg-background/50 relative p-4 lg:p-8 pb-24 md:pb-8">
            <Outlet />
          </main>
          
          {/* Mobile Bottom Nav (hidden on tablets and desktops) */}
          <div className="md:hidden">
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
