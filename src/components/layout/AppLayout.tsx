import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

import { useOfflineSync } from '@/hooks/useOfflineSync'

export default function AppLayout() {
  const { isOnline } = useOfflineSync()

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {!isOnline && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold text-center py-1.5 px-4 z-50 shadow-sm animate-pulse">
          ⚠️ Running in Offline Mode. Transactions will be queued locally and synced automatically when connection is restored.
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto bg-background/50 relative">
          <Outlet />
        </main>
        
        {/* Mobile Bottom Nav */}
        <div className="md:hidden">
          <BottomNav />
        </div>
    </div>
    </div>
    </div>
  )
}
