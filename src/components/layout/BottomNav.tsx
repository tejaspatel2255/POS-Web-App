// File Path: d:/Projects/Web/Universal POS/src/components/layout/BottomNav.tsx

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, History, ListMinus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { canManageMenu, canManageStaff } from '@/lib/permissions'

export default function BottomNav() {
  const { activeMember } = useAuth()
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg flex justify-around items-center h-16 border-t border-muted/50 shadow-[0_-8px_20px_rgba(0,0,0,0.06)] pb-safe pb-[env(safe-area-inset-bottom)] px-2">
      {visibleItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full space-y-0.5 transition-all duration-200 min-h-[44px] relative py-1 text-muted-foreground",
              isActive ? "text-primary font-bold" : "hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-200", isActive && "scale-110")} />
              <span className="text-[10px] font-semibold tracking-wide hidden min-[360px]:inline">
                {item.name}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
