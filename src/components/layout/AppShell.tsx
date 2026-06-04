// src/components/layout/AppShell.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import OfflineBanner from '../shared/OfflineBanner'
import { Store as StoreIcon, Wifi } from 'lucide-react'

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

export default function AppShell() {
  const { activeStore } = useAuthStore()

  const getStoreIcon = (type: string) => {
    const found = storeTypes.find((t) => t.id === type)
    return found ? found.icon : '🏬'
  }

  // Set the store's theme color in document styling dynamically if present
  React.useEffect(() => {
    if (activeStore?.theme_color) {
      document.documentElement.style.setProperty('--store-primary', activeStore.theme_color)
    }
  }, [activeStore])

  return (
    <div className="min-h-screen bg-[#fffbf5] flex flex-col">
      {/* Offline Alert Banner */}
      <OfflineBanner />

      <div className="flex flex-1 relative">
        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block w-[240px] shrink-0">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl bg-gray-50 p-1.5 rounded-xl border border-gray-100 block lg:hidden">
                {activeStore ? getStoreIcon(activeStore.store_type) : '🏬'}
              </span>
              <div className="flex flex-col">
                <h1 className="font-bold text-gray-900 font-heading leading-tight truncate max-w-[200px] sm:max-w-md">
                  {activeStore?.name || 'POS Workspace'}
                </h1>
                {activeStore?.tagline && (
                  <p className="text-[10px] text-gray-500 font-body hidden sm:block">{activeStore.tagline}</p>
                )}
              </div>
            </div>

            {/* Logo/Avatar */}
            <div className="flex items-center gap-3">
              {activeStore?.logo_url ? (
                <img
                  src={activeStore.logo_url}
                  alt={activeStore.name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-150"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: activeStore?.theme_color || '#0f766e' }}
                >
                  {activeStore?.name ? activeStore.name.charAt(0).toUpperCase() : 'P'}
                </div>
              )}
            </div>
          </header>

          {/* Page Outlet */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto pb-24 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom Nav - Mobile Only */}
      <div className="block lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
