// src/pages/menu/MenuManagement.tsx
import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { canManageMenu } from '../../lib/permissions'
import CategoriesTab from './CategoriesTab'
import ProductsTab from './ProductsTab'
import { FolderTree, Package, AlertCircle } from 'lucide-react'

export default function MenuManagement() {
  const { activeStore, activeMember } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'categories' | 'products'>('categories')

  const role = activeMember?.role || 'cashier'

  // Role gate check
  if (!canManageMenu(role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 font-heading">Access Denied</h3>
        <p className="text-gray-500 font-body text-sm mt-2">
          Only store owners and admins have permission to manage the product catalog and categories.
        </p>
      </div>
    )
  }

  const primaryColor = activeStore?.theme_color || '#0f766e'

  return (
    <div className="space-y-6">
      {/* Header and Tab Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Catalog Management</h2>
          <p className="text-gray-500 font-body text-sm mt-0.5">Manage category groupings and product stock details</p>
        </div>

        {/* Tab selection pills */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-150 shrink-0">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-body transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categories</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-body transition-all ${
              activeTab === 'products'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products Inventory</span>
          </button>
        </div>
      </div>

      {/* Rendering tab contents */}
      <div className="min-h-[400px]">
        {activeTab === 'categories' ? <CategoriesTab /> : <ProductsTab />}
      </div>
    </div>
  )
}
