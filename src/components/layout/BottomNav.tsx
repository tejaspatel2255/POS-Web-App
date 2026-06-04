// src/components/layout/BottomNav.tsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard,
  Calculator,
  History,
  FolderTree,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react'
import { canManageMenu, canViewReports, canManageStaff } from '../../lib/permissions'

export default function BottomNav() {
  const { activeStore, activeMember } = useAuthStore()

  const role = activeMember?.role || 'cashier'
  const activeColor = activeStore?.theme_color || '#0f766e'

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard, show: true },
    { to: '/billing', label: 'Billing', icon: Calculator, show: true },
    { to: '/orders', label: 'Orders', icon: History, show: true },
    { to: '/menu', label: 'Menu', icon: FolderTree, show: canManageMenu(role) },
    { to: '/reports', label: 'Reports', icon: BarChart3, show: canViewReports(role) },
    { to: '/settings', label: 'Settings', icon: SettingsIcon, show: canManageStaff(role) },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 flex items-center justify-around z-40 pb-safe shadow-lg">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            color: isActive ? activeColor : undefined,
          })}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-semibold font-body transition-colors ${
              isActive ? '' : 'text-gray-400 hover:text-gray-700'
            }`
          }
        >
          <item.icon className="w-5 h-5 mb-0.5 shrink-0" />
          <span className="text-[10px] tracking-tight">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
