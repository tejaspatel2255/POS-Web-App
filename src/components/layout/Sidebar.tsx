// File Path: d:/Projects/Web/Universal POS/src/components/layout/Sidebar.tsx

import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Receipt, History, ListMinus, LineChart, Settings, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabaseClient'
import { canManageMenu, canViewReports, canManageStaff } from '@/lib/permissions'

const STORE_TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  ice_cream: '🍦',
  grocery: '🛒',
  pharmacy: '💊',
  retail: '🏪',
  clothing: '👗',
  electronics: '📱',
  other: '🏬',
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, activeStore, activeMember } = useAuth()
  const role = activeMember?.role

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const allNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, show: true },
    { name: 'Billing', href: '/billing', icon: Receipt, show: true },
    { name: 'History', href: '/history', icon: History, show: true },
    { name: 'Menu', href: '/menu', icon: ListMinus, show: canManageMenu(role) },
    { name: 'Reports', href: '/reports', icon: LineChart, show: canViewReports(role) },
    { name: 'Settings', href: '/settings', icon: Settings, show: canManageStaff(role) }, // settings/staff management limited to owner
  ]

  const visibleItems = allNavItems.filter(item => item.show)
  const storeIcon = activeStore ? (STORE_TYPE_ICONS[activeStore.store_type] || '🏬') : '🏬'

  return (
    <aside className="w-64 bg-primary text-primary-foreground flex flex-col h-full border-r-0 rounded-r-2xl shadow-xl z-20">
      {/* Top Branding Section */}
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="bg-white/20 p-2 rounded-xl shadow-inner text-2xl">
          {storeIcon}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold font-poppins tracking-wide truncate">
            {activeStore?.name || 'Universal POS'}
          </h1>
          <p className="text-[10px] text-white/60 font-semibold tracking-wider uppercase">
            {role || 'Staff'}
          </p>
        </div>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                isActive 
                  ? "bg-secondary text-secondary-foreground shadow-md transform scale-[1.02]" 
                  : "hover:bg-white/10 text-white/80 hover:text-white"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      {/* Bottom User Info Section */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5">
          <User className="w-4 h-4 text-white/70" />
          <span className="text-xs font-medium text-white/90 truncate capitalize">
            {activeMember?.full_name || user?.email || 'Staff'}
          </span>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-destructive/25 text-white hover:text-white transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
