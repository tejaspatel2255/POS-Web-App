// File Path: d:/Projects/Web/Universal POS/src/components/pos/CategoryPanel.tsx

import type { Category } from '@/types'

interface CategoryPanelProps {
  categories: Category[]
  activeCategoryId: string | null
  onSelectCategory: (id: string | null) => void
  themeColor?: string
}

export default function CategoryPanel({
  categories,
  activeCategoryId,
  onSelectCategory,
  themeColor = '#0f766e',
}: CategoryPanelProps) {
  return (
    <aside className="w-full lg:w-48 bg-white/40 border border-white/50 rounded-2xl p-2.5 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:h-full scrollbar-none whitespace-nowrap flex-nowrap lg:flex-wrap lg:whitespace-normal">
      {/* "All" category selector */}
      <button
        onClick={() => onSelectCategory(null)}
        className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold font-poppins transition-all duration-200 flex items-center gap-2 border border-white/30 min-h-[44px] min-w-max"
        style={
          activeCategoryId === null
            ? { backgroundColor: themeColor, color: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
            : { backgroundColor: '#ffffff', color: 'inherit' }
        }
      >
        <span className="text-base">📋</span>
        <span>All Items</span>
      </button>

      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold font-poppins transition-all duration-200 flex items-center gap-2 border border-white/30 truncate min-h-[44px] min-w-[125px] justify-start"
            style={
              isActive
                ? { backgroundColor: themeColor, color: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }
                : { backgroundColor: '#ffffff', color: 'inherit' }
            }
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-white shadow-inner flex-shrink-0"
              style={isActive ? { backgroundColor: '#ffffff' } : { backgroundColor: cat.color }}
            />
            {cat.icon && <span className="text-base flex-shrink-0">{cat.icon}</span>}
            <span className="truncate">{cat.name}</span>
          </button>
        )
      })}
    </aside>
  )
}
