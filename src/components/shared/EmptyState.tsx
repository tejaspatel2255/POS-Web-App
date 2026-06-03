// File Path: d:/Projects/Web/Universal POS/src/components/shared/EmptyState.tsx

import { Inbox, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl bg-white/40 border-white/50 shadow-sm max-w-lg mx-auto my-8">
      <div className="p-4 bg-primary/10 text-primary rounded-full mb-4">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-lg font-bold font-poppins text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 bg-primary hover:bg-primary/90 shadow-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
