// File Path: d:/Projects/Web/Universal POS/src/pages/menu/MenuManagement.tsx

import { useState } from 'react'
import { FolderKanban, Salad } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import PageHeader from '@/components/shared/PageHeader'
import CategoriesTab from './CategoriesTab'
import ProductsTab from './ProductsTab'

export default function MenuManagement() {
  const { activeStore } = useAuth()
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('products')

  if (!activeStore) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-semibold">
        No active store selected. Please select or create a store.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        subtitle={`Configure the food items, products, and categories for ${activeStore.name}`}
      />

      {/* Tabs Header */}
      <div className="flex items-center border-b border-muted/50 pb-px gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-poppins text-sm font-semibold transition-all duration-200 ${
            activeTab === 'products'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Salad className="w-4 h-4" />
          Products List
        </button>
        
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-poppins text-sm font-semibold transition-all duration-200 ${
            activeTab === 'categories'
              ? 'border-primary text-primary bg-primary/5 rounded-t-lg'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Categories
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-250">
        {activeTab === 'categories' ? (
          <CategoriesTab storeId={activeStore.id} />
        ) : (
          <ProductsTab storeId={activeStore.id} currencySymbol={activeStore.currency_symbol} />
        )}
      </div>
    </div>
  )
}
