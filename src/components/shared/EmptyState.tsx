// src/components/shared/EmptyState.tsx
import React from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionText?: string
  onAction?: () => void
}

export default function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-gray-900 font-heading">{title}</h3>
      <p className="text-gray-500 font-body text-sm mt-1.5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-semibold font-body text-sm shadow-md shadow-[#0f766e]/10 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}
