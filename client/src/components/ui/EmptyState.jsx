import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title = 'No records found',
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 text-center">
      {Icon && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 dark:text-slate-500 mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-250 mb-1">
        {title}
      </h3>
      {message && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
          {message}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
