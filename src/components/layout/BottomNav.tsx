import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, History, ListMinus, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BottomNav() {
  const navItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Billing', href: '/billing', icon: Receipt },
    { name: 'History', href: '/history', icon: History },
    { name: 'Menu', href: '/menu', icon: ListMinus },
    { name: 'More', href: '/settings', icon: MoreHorizontal },
  ]

  return (
    <nav className="bg-primary text-primary-foreground flex justify-around items-center h-16 border-t border-white/10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-secondary" : "text-white/70 hover:text-white"
            )
          }
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  )
}
