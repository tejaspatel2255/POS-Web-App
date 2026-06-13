import { create } from 'zustand';
import { getPendingOrderCount } from '../lib/offlineDB';

export const useOfflineStore = create((set) => ({
  isOnline: navigator.onLine,
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,

  setOnline: (online) => set({ isOnline: online }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),

  refreshPendingCount: async () => {
    const count = await getPendingOrderCount();
    set({ pendingCount: count });
  },
}));
