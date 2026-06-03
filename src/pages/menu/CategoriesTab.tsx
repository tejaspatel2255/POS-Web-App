// File Path: d:/Projects/Web/Universal POS/src/pages/menu/CategoriesTab.tsx

import { useState } from 'react'
import { Plus, Edit3, Trash2, ShieldAlert } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useCategories'
import CategoryFormModal from '@/components/pos/CategoryFormModal'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import EmptyState from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import type { Category } from '@/types'

interface CategoriesTabProps {
  storeId: string
}

export default function CategoriesTab({ storeId }: CategoriesTabProps) {
  const { data: categories = [], isLoading } = useCategories(storeId)
  
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  
  // Custom Delete Confirm State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleOpenAddModal = () => {
    setSelectedCategory(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (category: Category) => {
    setSelectedCategory(category)
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedCategory) {
        await updateMutation.mutateAsync({
          id: selectedCategory.id,
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
      console.error('Failed to submit category form:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, store_id: storeId })
      setDeleteConfirmId(null)
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={5} />
  }

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      {/* Tab Actions */}
      <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm">
        <span className="text-xs sm:text-sm font-semibold text-muted-foreground">
          Total Categories: {categories.length}
        </span>
        <Button onClick={handleOpenAddModal} className="hidden md:flex bg-primary hover:bg-primary/90 items-center gap-2 min-h-[44px]">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          message="Create categories to organize your store's products on the POS menu."
          actionLabel="Create First Category"
          onAction={handleOpenAddModal}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block border border-white/50 bg-white/40 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase w-12 text-center">Color</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase w-12 text-center">Icon</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase">Category Name</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase w-28 text-center">Sort Order</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase w-28 text-center">Status</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-white/60 transition-colors">
                    <td className="p-4 text-center">
                      <span
                        className="inline-block w-4 h-4 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                    </td>
                    <td className="p-4 text-center text-xl">{cat.icon}</td>
                    <td className="p-4 font-bold text-foreground">{cat.name}</td>
                    <td className="p-4 text-center font-medium text-muted-foreground">{cat.sort_order}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          cat.is_active
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 rounded bg-white hover:bg-primary/10 text-primary border border-muted/50 transition-colors min-h-[44px]"
                          title="Edit Category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(cat.id)}
                          className="p-1.5 rounded bg-white hover:bg-destructive/10 text-destructive border border-muted/50 transition-colors min-h-[44px]"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 bg-white border border-muted/30 rounded-xl shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full border border-white shadow-sm flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xl leading-none flex-shrink-0">{cat.icon}</span>
                    <span className="font-bold text-foreground text-sm">{cat.name}</span>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                      cat.is_active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between pt-2.5 border-t border-muted/10">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    Sort Order: <span className="text-foreground font-bold">{cat.sort_order}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-2.5 rounded bg-white hover:bg-primary/10 text-primary border border-muted/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Edit Category"
                    >
                      <Edit3 className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="p-2.5 rounded bg-white hover:bg-destructive/10 text-destructive border border-muted/50 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Floating Add Category Button for Mobile Only */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-background/0 z-40">
        <Button
          onClick={handleOpenAddModal}
          className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 font-bold shadow-lg min-h-[48px] text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Category Add/Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Custom Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm border border-muted text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-poppins text-foreground">Confirm Category Deletion</h3>
              <p className="text-xs text-muted-foreground">
                This will hide all products currently assigned to this category on the billing POS. Do you wish to continue?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleteMutation.isPending}
              >
                No, Keep It
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
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
