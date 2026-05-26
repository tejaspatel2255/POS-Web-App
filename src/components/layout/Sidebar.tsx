import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Receipt, History, ListMinus, LineChart, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Billing', href: '/billing', icon: Receipt },
    { name: 'History', href: '/history', icon: History },
    ...(isAdmin ? [
      { name: 'Menu', href: '/menu', icon: ListMinus },
      { name: 'Reports', href: '/reports', icon: LineChart },
      { name: 'Settings', href: '/settings', icon: Settings },
    ] : [])
  ]

  return (
    <aside className="w-64 bg-primary text-primary-foreground flex flex-col h-full border-r-0 rounded-r-2xl shadow-xl z-20">
      <div className="p-6 flex items-center justify-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <span className="text-2xl">🍦</span>
          </div>
          <h1 className="text-xl font-bold font-poppins tracking-wide">Savaliya</h1>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
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
      
      <div className="p-4 border-t border-white/10 text-sm text-center text-white/60">
        <p>Savaliya POS v1.0</p>
      </div>
    </aside>
  )
}
