import React from 'react';

export default function PageHeader({ title, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800 space-y-4 sm:space-y-0">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none m-0">
          {title}
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        {children}
      </div>
    </div>
  );
}
