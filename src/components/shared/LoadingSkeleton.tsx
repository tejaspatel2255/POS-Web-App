// File Path: d:/Projects/Web/Universal POS/src/components/shared/LoadingSkeleton.tsx

import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'grid'
  count?: number
  className?: string
}

export default function LoadingSkeleton({
  variant = 'card',
  count = 3,
  className,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count })

  if (variant === 'table') {
    return (
      <div className={cn("w-full space-y-3", className)}>
        {/* Table Header Placeholder */}
        <div className="h-10 bg-muted/70 rounded-lg animate-pulse w-full" />
        {/* Table Rows Placeholder */}
        {items.map((_, i) => (
          <div key={i} className="flex items-center space-x-4 h-12 border-b border-muted/30 px-2">
            <div className="h-4 bg-muted/60 rounded animate-pulse w-1/12" />
            <div className="h-4 bg-muted/60 rounded animate-pulse w-4/12" />
            <div className="h-4 bg-muted/60 rounded animate-pulse w-2/12" />
            <div className="h-4 bg-muted/60 rounded animate-pulse w-2/12" />
            <div className="h-4 bg-muted/60 rounded animate-pulse w-3/12" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'grid') {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4", className)}>
        {items.map((_, i) => (
          <div key={i} className="p-4 rounded-xl border bg-white/40 border-white/50 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted/60 animate-pulse" />
            <div className="h-3 bg-muted/60 rounded animate-pulse w-16" />
          </div>
        ))}
      </div>
    )
  }

  // Default: card
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {items.map((_, i) => (
        <div key={i} className="p-6 rounded-2xl border bg-white/40 border-white/50 space-y-4">
          <div className="h-32 bg-muted/60 rounded-xl animate-pulse w-full" />
          <div className="space-y-2">
            <div className="h-4 bg-muted/60 rounded animate-pulse w-2/3" />
            <div className="h-3 bg-muted/60 rounded animate-pulse w-1/2" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="h-8 bg-muted/60 rounded-lg animate-pulse w-20" />
            <div className="h-8 bg-muted/60 rounded-lg animate-pulse w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
