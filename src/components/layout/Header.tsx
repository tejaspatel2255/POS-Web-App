import { useAuth } from '@/contexts/AuthContext'
import { LogOut, User } from 'lucide-react'
import { Button } from '../ui/button'

export default function Header() {
  const { profile, signOut } = useAuth()

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 sticky top-0">
      <div className="flex items-center gap-2 md:hidden">
        <img src="/logo.png" alt="Universal POS Logo" className="w-8 h-8 rounded-lg object-contain" />
        <h1 className="text-xl font-bold font-poppins text-primary">Universal POS</h1>
      </div>
      
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold text-foreground capitalize">
          Welcome back, {profile?.full_name || 'Staff'}
        </h2>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-white px-3 py-1.5 rounded-full border shadow-sm">
          <User className="w-4 h-4" />
          <span className="font-medium capitalize">{profile?.role}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={signOut} title="Sign Out" className="rounded-full hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
