import React, { useState } from 'react';
import { WifiOff, RefreshCw, CloudUpload } from 'lucide-react';
import { useOfflineStore } from '../../store/offlineStore';
import { syncPendingOrders } from '../../lib/syncEngine';
import toast from 'react-hot-toast';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, refreshPendingCount } = useOfflineStore();
  const [manualSyncing, setManualSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!isOnline || manualSyncing || isSyncing) return;
    setManualSyncing(true);
    try {
      const result = await syncPendingOrders();
      if (result.synced > 0) {
        toast.success(`${result.synced} bills synced!`);
        window.dispatchEvent(new Event('offline-sync-completed'));
      } else if (result.failed > 0) {
        toast.error(`${result.failed} bills failed to sync.`);
      } else {
        toast.success('All bills already synced!');
      }
    } finally {
      setManualSyncing(false);
      await refreshPendingCount();
    }
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold transition-all duration-300 z-50 shadow-md ${
      !isOnline ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-900'
    }`}>
      {/* Left: status */}
      <div className="flex items-center gap-2 min-w-0">
        {!isOnline ? (
          <>
            <WifiOff size={16} className="flex-shrink-0 animate-pulse text-white" />
            <span className="truncate text-white">
              You are offline — bills are saved on your device
            </span>
          </>
        ) : (
          <>
            <CloudUpload size={16} className="flex-shrink-0 animate-bounce text-slate-900" />
            <span className="truncate text-slate-900">
              {isSyncing || manualSyncing
                ? `Syncing ${pendingCount} bill${pendingCount > 1 ? 's' : ''}...`
                : `${pendingCount} bill${pendingCount > 1 ? 's' : ''} pending upload`
              }
            </span>
          </>
        )}
      </div>

      {/* Right: pending count badge + manual sync button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {pendingCount > 0 && (
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
            !isOnline ? 'bg-white/20 text-white' : 'bg-slate-900 text-white'
          }`}>
            {pendingCount}
          </span>
        )}
        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleManualSync}
            disabled={isSyncing || manualSyncing}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw
              size={12}
              className={isSyncing || manualSyncing ? 'animate-spin' : ''}
            />
            Sync now
          </button>
        )}
      </div>
    </div>
  );
}
