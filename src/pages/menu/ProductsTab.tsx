// src/pages/menu/ProductsTab.tsx
import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useCategories } from '../../hooks/useCategories'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleAvailability,
} from '../../hooks/useProducts'
import { Product } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { toast } from '../../components/shared/Toast'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import EmptyState from '../../components/shared/EmptyState'
import { Plus, Edit2, Trash2, Search, Filter, Package, Loader2, ToggleLeft, ToggleRight, X, Image as ImageIcon } from 'lucide-react'

export default function ProductsTab() {
  const { activeStore } = useAuthStore()
  const storeId = activeStore?.id
  const currencySymbol = activeStore?.currency_symbol || '₹'

  // Categories & Products Data
  const { data: categories = [] } = useCategories(storeId)
  
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: products = [], isLoading } = useProducts(
    storeId,
    filterCategoryId === 'all' ? null : filterCategoryId
  )

  const createMutation = useCreateProduct(storeId)
  const updateMutation = useUpdateProduct(storeId)
  const deleteMutation = useDeleteProduct(storeId)
  const toggleMutation = useToggleAvailability(storeId)

  // Modal Form States
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [costPrice, setCostPrice] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [unit, setUnit] = useState('pc')
  const [sortOrder, setSortOrder] = useState(0)
  const [isAvailable, setIsAvailable] = useState(true)

  // Confirm Delete
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Client-side filtering by search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openAddModal = () => {
    setEditingProduct(null)
    setName('')
    setCategoryId(categories[0]?.id || '')
    setPrice(0)
    setCostPrice(0)
    setDescription('')
    setImageUrl('')
    setUnit('pc')
    setSortOrder(products.length)
    setIsAvailable(true)
    setModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setCategoryId(product.category_id || '')
    setPrice(Number(product.price))
    setCostPrice(Number(product.cost_price || 0))
    setDescription(product.description || '')
    setImageUrl(product.image_url || '')
    setUnit(product.unit || 'pc')
    setSortOrder(product.sort_order || 0)
    setIsAvailable(product.is_available ?? true)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Product name is required')
      return
    }
    if (price < 0) {
      toast.error('Price cannot be negative')
      return
    }

    const payload = {
      name,
      category_id: categoryId || null,
      price,
      cost_price: costPrice,
      description,
      image_url: imageUrl || undefined,
      unit,
      sort_order: sortOrder,
      is_available: isAvailable,
    }

    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({ ...payload, id: editingProduct.id })
        toast.success('Product updated!')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Product created!')
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product')
    }
  }

  const handleToggleAvailable = async (product: Product) => {
    const nextState = !(product.is_available ?? true)
    try {
      await toggleMutation.mutateAsync({ id: product.id, isAvailable: nextState })
      toast.success(`${product.name} is now ${nextState ? 'available' : 'unavailable'}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to change availability status')
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await deleteMutation.mutateAsync(deleteTargetId)
      toast.success('Product deleted')
      setDeleteConfirmOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product')
    }
  }

  const getCategoryName = (catId?: string | null) => {
    if (!catId) return 'No Category'
    const found = categories.find((c) => c.id === catId)
    return found ? `${found.icon} ${found.name}` : 'Unassigned'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="block w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
            />
          </div>

          {/* Category Filter */}
          <div className="relative w-full sm:max-w-xs flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="block w-full px-3 py-2 text-sm bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-xs shadow-md shadow-[#0f766e]/10 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex items-center justify-center min-h-[300px]">
          <EmptyState
            icon={<Package className="w-8 h-8 text-gray-400" />}
            title="No Products Listed"
            description="Create stock items with pricing, category labels, and units."
            actionText="Add Product"
            onAction={openAddModal}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative ${
                !p.is_available ? 'bg-gray-50/50 opacity-90' : ''
              }`}
            >
              <div>
                {/* Image Section */}
                <div className="h-40 bg-gray-50 flex items-center justify-center border-b border-gray-100 relative">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center justify-center">
                      <ImageIcon className="w-12 h-12 stroke-[1.2]" />
                      <span className="text-[10px] uppercase font-bold mt-1 tracking-wider">{p.unit}</span>
                    </div>
                  )}

                  <span className="absolute top-3 left-3 text-xs bg-white/95 backdrop-blur px-2.5 py-1 rounded-full border border-gray-100 font-bold font-body text-gray-600 shadow-sm">
                    {getCategoryName(p.category_id)}
                  </span>
                </div>

                {/* Detail text */}
                <div className="p-4 space-y-1.5">
                  <h4 className="font-bold text-gray-900 font-heading line-clamp-1">{p.name}</h4>
                  {p.description && (
                    <p className="text-xs text-gray-500 font-body line-clamp-2 leading-relaxed h-8">
                      {p.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold font-body">Price</span>
                      <span className="font-bold text-gray-900 text-sm font-body">
                        {formatCurrency(p.price, currencySymbol)}
                      </span>
                    </div>
                    {p.cost_price > 0 && (
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 uppercase font-bold font-body">Cost</span>
                        <span className="font-semibold text-gray-500 text-xs font-body">
                          {formatCurrency(p.cost_price, currencySymbol)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status and Action bar */}
              <div className="p-4 border-t border-gray-50 bg-gray-50/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-body font-semibold">Available:</span>
                  <button
                    onClick={() => handleToggleAvailable(p)}
                    className={`transition-colors focus:outline-none ${
                      p.is_available ? 'text-[#0f766e]' : 'text-gray-350'
                    }`}
                  >
                    {p.is_available ? (
                      <ToggleRight className="w-8 h-5 stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="w-8 h-5 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-gray-450 hover:text-[#0f766e] hover:bg-gray-150 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(p.id)}
                    className="p-1.5 text-gray-455 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Edit / Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 p-6 animate-zoom-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-450 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 font-heading mb-4">
              {editingProduct ? 'Edit Product' : 'Create Product'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                  placeholder="e.g. Cheese Pizza, Paracetamol 500mg"
                />
              </div>

              {/* Category dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="block w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price & Cost Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                    Sale Price ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={price || ''}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                    Cost Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                  />
                </div>
              </div>

              {/* Unit & Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                    Unit Measurement
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                    placeholder="e.g. pc, kg, pack, ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                    Sort order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-body"
                  placeholder="Ingredients or details of the product..."
                />
              </div>

              {/* Image URL with live preview */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {imageUrl.trim().startsWith('http') && (
                  <div className="mt-2.5 h-20 w-28 border border-gray-150 rounded-xl overflow-hidden shadow-sm shrink-0">
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Available Check */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 font-body">In Stock:</span>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`transition-colors focus:outline-none ${
                    isAvailable ? 'text-[#0f766e]' : 'text-gray-350'
                  }`}
                >
                  {isAvailable ? (
                    <ToggleRight className="w-9 h-6 stroke-[1.5]" />
                  ) : (
                    <ToggleLeft className="w-9 h-6 stroke-[1.5]" />
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold font-body text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-xs transition-colors shadow-md flex items-center gap-1.5"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Save Product</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product from the inventory?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
