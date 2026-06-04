// src/components/shared/Toast.tsx
import React, { useState, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'warning'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

type ToastListener = (toast: ToastItem) => void

let listeners: ToastListener[] = []

export const toast = {
  success(message: string) {
    const id = Math.random().toString(36).substring(2, 9)
    listeners.forEach((l) => l({ id, type: 'success', message }))
  },
  error(message: string) {
    const id = Math.random().toString(36).substring(2, 9)
    listeners.forEach((l) => l({ id, type: 'error', message }))
  },
  warning(message: string) {
    const id = Math.random().toString(36).substring(2, 9)
    listeners.forEach((l) => l({ id, type: 'warning', message }))
  },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handleAdd = (toast: ToastItem) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3000)
    }

    listeners.push(handleAdd)
    return () => {
      listeners = listeners.filter((l) => l !== handleAdd)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-[320px] pointer-events-none">
      {toasts.map((t) => {
        let typeClasses = 'bg-emerald-50 border-emerald-200 text-emerald-800'
        if (t.type === 'error') {
          typeClasses = 'bg-rose-50 border-rose-200 text-rose-800'
        } else if (t.type === 'warning') {
          typeClasses = 'bg-amber-50 border-amber-200 text-amber-800'
        }

        return (
          <div
            key={t.id}
            className={`p-3.5 rounded-xl border shadow-md font-medium text-sm pointer-events-auto transition-all animate-slide-in font-body ${typeClasses}`}
          >
            {t.message}
          </div>
        )
      })}
      <style>{`
        @keyframes slide-in {
          from { transform: translateY(-1rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
