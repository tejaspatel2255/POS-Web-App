import React from 'react';

export default function FormField({
  label,
  error,
  required = false,
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col space-y-1 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-350 tracking-wide">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="text-xs font-semibold text-rose-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
