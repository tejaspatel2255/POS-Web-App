// File Path: d:/Projects/Web/Universal POS/src/pages/menu/ProductsTab.tsx

import { useState, useMemo } from 'react'
import { Plus, Edit3, Trash2, Search, Filter, ShieldAlert, CheckSquare, Square } from 'lucide-react'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleAvailability,
} from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import ProductFormModal from '@/components/pos/ProductFormModal'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatCurrency'
import type { Product } from '@/types'

interface ProductsTabProps {
  storeId: string
  currencySymbol: string
}

export default function ProductsTab({ storeId, currencySymbol }: ProductsTabProps) {
  const { data: categories = [] } = useCategories(storeId)
  const { data: products = [], isLoading } = useProducts(storeId)

  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()
  const toggleMutation = useToggleAvailability()

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Filtering & Search
  const [search, setSearch] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  // Custom Delete Confirm State
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null)

  const handleOpenAddModal = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (product: Product) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedProduct) {
        await updateMutation.mutateAsync({
          id: selectedProduct.id,
          store_id: storeId,
          changes: values,
        })
      } else {
        await createMutation.mutateAsync({
          store_id: storeId,
          ...values,
        })
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error('Failed to submit product form:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, store_id: storeId })
      setDeleteConfirmProduct(null)
      // Remove from selection if deleted
      const updated = new Set(selectedIds)
      updated.delete(id)
      setSelectedIds(updated)
    } catch (err) {
      console.error('Failed to delete product:', err)
    }
  }

  const handleToggleAvailable = async (product: Product) => {
    try {
      await toggleMutation.mutateAsync({
        id: product.id,
        store_id: storeId,
        is_available: !product.is_available,
      })
    } catch (err) {
      console.error('Failed to toggle product status:', err)
    }
  }

  // Bulk Selection Operations
  const handleSelectProduct = (id: string) => {
    const updated = new Set(selectedIds)
    if (updated.has(id)) {
      updated.delete(id)
    } else {
      updated.add(id)
    }
    setSelectedIds(updated)
  }

  const handleSelectAllFiltered = (filteredProducts: Product[]) => {
    const allSelected = filteredProducts.every((p) => selectedIds.has(p.id))
    const updated = new Set(selectedIds)
    if (allSelected) {
      filteredProducts.forEach((p) => updated.delete(p.id))
    } else {
      filteredProducts.forEach((p) => updated.add(p.id))
    }
    setSelectedIds(updated)
  }

  const handleBulkToggleAvailability = async (is_available: boolean) => {
    setIsBulkUpdating(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          toggleMutation.mutateAsync({
            id,
            store_id: storeId,
            is_available,
          })
        )
      )
      setSelectedIds(new Set())
    } catch (err) {
      console.error('Bulk update failed:', err)
    } finally {
      setIsBulkUpdating(false)
    }
  }

  // Filter products by category and search string
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, selectedCategoryFilter, search])

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={6} />
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      
      {/* Filtering Header Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm items-center">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5 sm:top-3" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-11 sm:h-10"
          />
        </div>

        {/* Category Filter dropdown */}
        <div className="relative flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <select
            className="w-full h-11 sm:h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Product Button */}
        <div className="flex justify-end">
          <Button onClick={handleOpenAddModal} className="hidden sm:flex bg-primary hover:bg-primary/90 items-center gap-2 w-full sm:w-auto justify-center min-h-[40px]">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Bulk Action Panel (Renders only when item is selected) */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-primary animate-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-bold flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Selected {selectedIds.size} product{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => handleBulkToggleAvailability(true)}
              variant="outline"
              className="border-primary/20 hover:bg-primary/10 text-xs h-10 sm:h-9 font-bold flex-1 sm:flex-initial"
              disabled={isBulkUpdating}
            >
              Mark Available
            </Button>
            <Button
              onClick={() => handleBulkToggleAvailability(false)}
              variant="outline"
              className="border-primary/20 hover:bg-primary/10 text-xs h-10 sm:h-9 font-bold flex-1 sm:flex-initial"
              disabled={isBulkUpdating}
            >
              Mark Unavailable
            </Button>
            <Button
              onClick={() => setSelectedIds(new Set())}
              variant="ghost"
              className="text-xs h-10 sm:h-9 hover:bg-transparent min-w-[44px]"
              disabled={isBulkUpdating}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Product Display Panel */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No products found"
          message={search || selectedCategoryFilter !== 'all' ? 'Try adjusting your search filters.' : 'Add your first product to get started.'}
          actionLabel={search || selectedCategoryFilter !== 'all' ? undefined : 'Add Product'}
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="space-y-3">
          {/* Select All Toggle */}
          <div className="flex items-center gap-2 pl-2">
            <button
              onClick={() => handleSelectAllFiltered(filteredProducts)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5 min-h-[44px]"
            >
              {filteredProducts.every((p) => selectedIds.has(p.id)) ? (
                <CheckSquare className="w-4 h-4 text-primary" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Select All Shown ({filteredProducts.length})
            </button>
          </div>

          {/* Cards Grid: 2 columns on mobile, 3 columns on tablet/md, 4 on lg */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((p) => {
              const categoryObj = categories.find((c) => c.id === p.category_id)
              const categoryBadge = categoryObj ? (
                <span
                  className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded border font-semibold shadow-inner uppercase tracking-wider truncate max-w-[80px] sm:max-w-none"
                  style={{
                    backgroundColor: `${categoryObj.color}15`,
                    color: categoryObj.color,
                    borderColor: `${categoryObj.color}30`,
                  }}
                >
                  {categoryObj.icon} {categoryObj.name}
                </span>
              ) : (
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded border border-muted bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider">
                  Unassigned
                </span>
              )

              return (
                <Card
                  key={p.id}
                  className={`border-white/50 bg-white/40 hover:shadow-lg transition-all duration-300 relative flex flex-col justify-between overflow-hidden group ${
                    !p.is_available ? 'opacity-75' : ''
                  }`}
                >
                  {/* Select Checkbox Overlays */}
                  <button
                    onClick={() => handleSelectProduct(p.id)}
                    className="absolute top-2 left-2 z-10 w-8 h-8 rounded-md bg-white border border-muted flex items-center justify-center shadow-sm opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
                  >
                    {selectedIds.has(p.id) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>

                  <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
                    {/* Image / Placeholder */}
                    <div className="h-20 sm:h-32 border border-muted/20 rounded-xl overflow-hidden bg-muted/10 relative flex items-center justify-center">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-3xl sm:text-4xl filter grayscale">🍲</span>
                      )}
                      
                      {!p.is_available && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-[9px] sm:text-xs">
                          OUT OF STOCK
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        {categoryBadge}
                        {p.unit && (
                          <span className="text-[8px] sm:text-[10px] text-muted-foreground font-semibold">
                            Unit: {p.unit}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-foreground font-poppins text-xs sm:text-sm truncate" title={p.name}>
                        {p.name}
                      </h4>
                      <p className="text-sm sm:text-lg font-extrabold text-primary font-poppins">
                        {formatCurrency(p.price, currencySymbol)}
                      </p>
                    </div>
                  </div>

                  {/* Actions Panel */}
                  <div className="p-2 sm:px-4 sm:py-3 bg-muted/20 border-t border-muted/30 flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                    {/* Availability Switch */}
                    <div className="flex items-center gap-1.5 min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={p.is_available}
                        onChange={() => handleToggleAvailable(p)}
                        className="w-5 h-5 cursor-pointer accent-primary"
                        id={`avail-${p.id}`}
                      />
                      <label htmlFor={`avail-${p.id}`} className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase cursor-pointer select-none">
                        {p.is_available ? 'In Stock' : 'Out Stock'}
                      </label>
                    </div>

                    {/* Edit/Delete */}
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-2.5 sm:p-1.5 rounded bg-white hover:bg-primary/10 text-primary border border-muted/30 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      >
                        <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmProduct(p)}
                        className="p-2.5 sm:p-1.5 rounded bg-white hover:bg-destructive/10 text-destructive border border-muted/30 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating Add Product Button for Mobile Only */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-background/0 z-40">
        <Button
          onClick={handleOpenAddModal}
          className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 font-bold shadow-lg min-h-[48px] text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
        categories={categories}
        currencySymbol={currencySymbol}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-muted text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-poppins text-foreground">Delete Product?</h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to permanently delete "{deleteConfirmProduct.name}"? This action is irreversible.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmProduct.id)}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
