import React from 'react';
import { useOfflineStore } from '../../store/offlineStore';

export function PendingBadge() {
  const { pendingCount, isOnline } = useOfflineStore();
  if (pendingCount === 0) return null;

  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black leading-none ${
      isOnline ? 'bg-amber-500 text-slate-900' : 'bg-rose-500 text-white'
    }`}>
      {pendingCount > 99 ? '99+' : pendingCount}
    </span>
  );
}
