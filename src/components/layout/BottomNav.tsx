// File Path: d:/Projects/Web/Universal POS/src/components/layout/BottomNav.tsx

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, History, ListMinus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { canManageMenu, canManageStaff } from '@/lib/permissions'

export default function BottomNav() {
  const { activeStore, activeMember } = useAuth()
  const role = activeMember?.role

  const navItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard, show: true },
    { name: 'Billing', href: '/billing', icon: Receipt, show: true },
    { name: 'History', href: '/history', icon: History, show: true },
    { name: 'Menu', href: '/menu', icon: ListMinus, show: canManageMenu(role) },
    { name: 'Settings', href: '/settings', icon: Settings, show: canManageStaff(role) },
  ]

  const visibleItems = navItems.filter(item => item.show)

  return (
    <nav className="bg-primary text-primary-foreground flex justify-around items-center h-16 border-t border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 pb-safe">
      {visibleItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200",
              isActive ? "text-secondary font-semibold" : "text-white/70 hover:text-white"
            )
          }
          style={({ isActive }) => 
            isActive && activeStore?.theme_color 
              ? { color: activeStore.theme_color === '#0f766e' ? undefined : '#f59e0b' } // fallback or highlight matching theme
              : {}
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  )
}
