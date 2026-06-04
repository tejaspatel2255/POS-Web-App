// src/components/layout/Sidebar.tsx
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { toast } from '../shared/Toast'
import {
  LayoutDashboard,
  Calculator,
  History,
  FolderTree,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Store as StoreIcon,
} from 'lucide-react'
import { canManageMenu, canViewReports, canManageStaff } from '../../lib/permissions'

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

export default function Sidebar() {
  const navigate = useNavigate()
  const { activeStore, activeMember, logout } = useAuthStore()

  const role = activeMember?.role || 'cashier'

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.message || 'Logout failed')
    }
  }

  const getStoreIcon = (type: string) => {
    const found = storeTypes.find((t) => t.id === type)
    return found ? found.icon : '🏬'
  }

  // Navigation schema with permissions checks
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/billing', label: 'Billing Screen', icon: Calculator, show: true },
    { to: '/orders', label: 'Order History', icon: History, show: true },
    { to: '/menu', label: 'Menu & Stock', icon: FolderTree, show: canManageMenu(role) },
    { to: '/reports', label: 'Reports', icon: BarChart3, show: canViewReports(role) },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, show: canManageStaff(role) }, // settings requires owner (canManageStaff)
  ]

  const activeColor = activeStore?.theme_color || '#0f766e'

  return (
    <div className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-gray-100 flex flex-col justify-between z-20">
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Workspace Brand Header */}
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <span className="text-3xl bg-gray-50 p-1.5 rounded-xl border border-gray-100 block">
            {activeStore ? getStoreIcon(activeStore.store_type) : '🏬'}
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 font-heading leading-tight truncate">
              {activeStore?.name || 'Universal POS'}
            </h2>
            <span className="text-[10px] uppercase font-semibold font-body tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 mt-1 inline-block">
              {role}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  color: isActive ? activeColor : undefined,
                  backgroundColor: isActive ? `${activeColor}10` : undefined,
                })}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium font-body transition-colors group ${
                    isActive
                      ? ''
                      : 'text-gray-500 hover:text-gray-950 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium font-body text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}
