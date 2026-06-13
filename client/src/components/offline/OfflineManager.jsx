import React, { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useOfflineStore } from '../../store/offlineStore';
import { syncPendingOrders } from '../../lib/syncEngine';

export function OfflineManager() {
  const {
    setOnline,
    setSyncing,
    setLastSyncAt,
    refreshPendingCount,
  } = useOfflineStore();

  const syncTimeoutRef = useRef(null);

  const runSync = async () => {
    await refreshPendingCount();
    const count = useOfflineStore.getState().pendingCount;
    if (count === 0) return;

    setSyncing(true);
    const toastId = toast.loading(`Syncing ${count} offline bill${count > 1 ? 's' : ''}...`);

    try {
      const result = await syncPendingOrders();

      if (result.synced > 0) {
        toast.success(
          `✓ ${result.synced} offline bill${result.synced > 1 ? 's' : ''} synced!`,
          { id: toastId, duration: 4000 }
        );
        // Dispatch custom event to let components reload their list
        window.dispatchEvent(new Event('offline-sync-completed'));
      }

      if (result.failed > 0) {
        toast.error(
          `${result.failed} bill${result.failed > 1 ? 's' : ''} failed to sync. Will retry.`,
          { id: result.synced > 0 ? undefined : toastId, duration: 5000 }
        );
      }

      if (result.synced === 0 && result.failed === 0) {
        toast.dismiss(toastId);
      }

    } catch (err) {
      toast.error('Sync failed. Will retry when online.', { id: toastId });
    } finally {
      setSyncing(false);
      setLastSyncAt(new Date());
      await refreshPendingCount();
    }
  };

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setOnline(true);
      toast.success('Back online!', {
        icon: '🌐',
        duration: 3000,
        style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
      });

      syncTimeoutRef.current = setTimeout(() => {
        runSync();
      }, 1500);
    };

    const handleOffline = () => {
      setOnline(false);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      toast.error('You are offline. Bills will be saved locally.', {
        icon: '📵',
        duration: 5000,
        style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      runSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  return null;
}
