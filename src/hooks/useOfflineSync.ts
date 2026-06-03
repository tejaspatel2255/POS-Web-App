import { useEffect, useState } from 'react'
import { syncPendingOrders } from '../lib/syncEngine'

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      setSyncing(true)
      await syncPendingOrders()
      setSyncing(false)
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Run initial sync check
    if (navigator.onLine) {
      setSyncing(true)
      syncPendingOrders().finally(() => setSyncing(false))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, syncing }
}

