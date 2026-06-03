// File Path: d:/Projects/Web/Universal POS/src/components/shared/OfflineBanner.tsx

import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import { getPendingOrderCount } from '@/lib/offlineDb'
import { syncPendingOrders } from '@/lib/syncEngine'
import { useToast } from '../ui/use-toast'

export default function OfflineBanner() {
  const { toast } = useToast()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingOrderCount()
      setPendingCount(count)
    }

    updatePendingCount()

    // Interval to poll pending count when offline
    const interval = setInterval(updatePendingCount, 5000)

    const handleOnline = async () => {
      setIsOnline(true)
      const count = await getPendingOrderCount()
      if (count > 0) {
        toast({
          title: '🔌 Reconnecting...',
          description: `Attempting to sync ${count} offline order(s)...`,
        })
        // Trigger sync
        await syncPendingOrders()
        const afterCount = await getPendingOrderCount()
        const syncedCount = count - afterCount
        if (syncedCount > 0) {
          toast({
            title: '✅ Back online',
            description: `Successfully synced ${syncedCount} orders to Supabase!`,
            variant: 'default',
          })
        }
      }
      updatePendingCount()
    }

    const handleOffline = () => {
      setIsOnline(false)
      updatePendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  if (isOnline) return null

  return (
    <div className="bg-destructive text-destructive-foreground py-2.5 px-4 text-center text-xs font-bold shadow-md z-50 flex items-center justify-center gap-2 animate-pulse w-full">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>
        You are currently offline. Bills will be saved locally to IndexedDB and uploaded when connection is restored.
      </span>
      {pendingCount > 0 && (
        <span className="bg-white/20 border border-white/40 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
          {pendingCount} Pending Sync
        </span>
      )}
    </div>
  )
}
