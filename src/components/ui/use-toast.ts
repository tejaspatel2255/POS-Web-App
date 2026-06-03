// File Path: d:/Projects/Web/Universal POS/src/components/ui/use-toast.ts

import { useState, useEffect } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

type ToastCallback = (toast: Toast) => void

const listeners = new Set<ToastCallback>()

export function toast(props: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast = { id, ...props }
  listeners.forEach((cb) => cb(newToast))
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3500)
    }

    listeners.add(handleToast)
    return () => {
      listeners.delete(handleToast)
    }
  }, [])

  return {
    toast,
    toasts,
  }
}
export { toast as toastFn }
