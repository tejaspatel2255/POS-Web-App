// src/components/pos/CategoryPanel.tsx
import React from 'react'
import { Category } from '../../types'

interface CategoryPanelProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  activeColor: string
}

export default function CategoryPanel({
  categories,
  selectedCategoryId,
  onSelectCategory,
  activeColor,
}: CategoryPanelProps) {
  return (
    <div className="w-full">
      {/* Mobile Horizontal Pill Scroll */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-3 w-full scrollbar-none">
        <button
          onClick={() => onSelectCategory(null)}
          className="px-4 py-2 rounded-xl text-xs font-bold font-body whitespace-nowrap transition-all border"
          style={{
            borderColor: selectedCategoryId === null ? activeColor : '#e5e7eb',
            backgroundColor: selectedCategoryId === null ? `${activeColor}10` : '#f9fafb',
            color: selectedCategoryId === null ? activeColor : '#6b7280',
          }}
        >
          📦 All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="px-4 py-2 rounded-xl text-xs font-bold font-body whitespace-nowrap transition-all border flex items-center gap-1.5"
            style={{
              borderColor: selectedCategoryId === cat.id ? activeColor : '#e5e7eb',
              backgroundColor: selectedCategoryId === cat.id ? `${activeColor}10` : '#f9fafb',
              color: selectedCategoryId === cat.id ? activeColor : '#6b7280',
            }}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: cat.color || activeColor }}
            />
            <span>
              {cat.icon} {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Desktop Vertical Scrollable List */}
      <div className="hidden md:flex flex-col gap-2 w-[180px] overflow-y-auto max-h-[calc(100vh-14.5rem)] pr-1">
        <button
          onClick={() => onSelectCategory(null)}
          className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold font-body text-left border transition-all hover:bg-gray-50 active:scale-[0.98]"
          style={{
            borderColor: selectedCategoryId === null ? activeColor : '#f3f4f6',
            backgroundColor: selectedCategoryId === null ? `${activeColor}10` : '#ffffff',
            color: selectedCategoryId === null ? activeColor : '#4b5563',
          }}
        >
          <span className="text-lg">📦</span>
          <span className="truncate">All Products</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold font-body text-left border transition-all hover:bg-gray-50 active:scale-[0.98]"
            style={{
              borderColor: selectedCategoryId === cat.id ? activeColor : '#f3f4f6',
              backgroundColor: selectedCategoryId === cat.id ? `${cat.color}12` : '#ffffff',
              color: selectedCategoryId === cat.id ? activeColor : '#4b5563',
            }}
          >
            <span className="text-lg shrink-0">{cat.icon || '📦'}</span>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="truncate font-semibold">{cat.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
