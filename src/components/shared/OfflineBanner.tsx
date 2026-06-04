// src/components/shared/OfflineBanner.tsx
import React, { useState, useEffect } from 'react'
import { WifiOff, AlertCircle } from 'lucide-react'
import { getPendingOrders } from '../../lib/offlineDb'
import { syncPendingOrders } from '../../lib/syncEngine'
import { toast } from './Toast'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  const updatePendingCount = async () => {
    try {
      const orders = await getPendingOrders()
      setPendingCount(orders.length)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    updatePendingCount()

    // Poll to keep the UI in sync
    const interval = setInterval(updatePendingCount, 4000)

    const handleOnline = async () => {
      setIsOnline(true)
      const count = (await getPendingOrders()).length
      if (count > 0) {
        toast.success('Connection restored! Syncing offline orders...')
        await syncPendingOrders()
        const afterCount = (await getPendingOrders()).length
        const synced = count - afterCount
        if (synced > 0) {
          toast.success(`Successfully synced ${synced} orders!`)
        }
      } else {
        toast.success('You are back online!')
      }
      updatePendingCount()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Connection lost. Working offline!')
      updatePendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('offline-order-saved', updatePendingCount)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline-order-saved', updatePendingCount)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="bg-amber-600 text-white py-2 px-4 flex items-center justify-between gap-3 text-xs font-semibold font-body z-50 sticky top-0 shadow-md">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
        <span>Offline Mode Active. Sales will auto-sync when connection is restored.</span>
      </div>
      {pendingCount > 0 && (
        <div className="bg-amber-700/50 px-2.5 py-0.5 rounded-full text-[10px] uppercase flex items-center gap-1 border border-white/20">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{pendingCount} Saved Offline</span>
        </div>
      )}
    </div>
  )
}
