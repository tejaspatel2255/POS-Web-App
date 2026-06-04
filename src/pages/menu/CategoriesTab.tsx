// src/pages/menu/CategoriesTab.tsx
import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useCategories'
import { Category } from '../../types'
import { toast } from '../../components/shared/Toast'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import EmptyState from '../../components/shared/EmptyState'
import { Plus, Edit2, Trash2, FolderTree, Loader2, ToggleLeft, ToggleRight, X } from 'lucide-react'

const colorSwatches = [
  '#0f766e', // Teal
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#64748b', // Slate
]

export default function CategoriesTab() {
  const { activeStore } = useAuthStore()
  const storeId = activeStore?.id

  const { data: categories = [], isLoading } = useCategories(storeId)
  const createMutation = useCreateCategory(storeId)
  const updateMutation = useUpdateCategory(storeId)
  const deleteMutation = useDeleteCategory(storeId)

  // Modal / Form States
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  const [name, setName] = useState('')
  const [color, setColor] = useState(colorSwatches[0])
  const [icon, setIcon] = useState('📦')
  const [sortOrder, setSortOrder] = useState(0)

  // Confirm Delete state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const openAddModal = () => {
    setEditingCategory(null)
    setName('')
    setColor(colorSwatches[0])
    setIcon('📦')
    setSortOrder(categories.length)
    setModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setColor(cat.color || colorSwatches[0])
    setIcon(cat.icon || '📦')
    setSortOrder(cat.sort_order || 0)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Category name is required')
      return
    }

    const payload = {
      name,
      color,
      icon,
      sort_order: sortOrder,
      is_active: editingCategory ? editingCategory.is_active : true,
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({ ...payload, id: editingCategory.id })
        toast.success('Category updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Category created successfully')
      }
      setModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category')
    }
  }

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateMutation.mutateAsync({
        id: cat.id,
        is_active: !cat.is_active,
      })
      toast.success(`Category ${!cat.is_active ? 'enabled' : 'disabled'}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category state')
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
      toast.success('Category deleted')
      setDeleteConfirmOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category')
    }
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
      {/* Top Action */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <span className="text-sm font-semibold font-body text-gray-500">
          Total Categories: <strong className="text-gray-800">{categories.length}</strong>
        </span>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-xs shadow-md shadow-[#0f766e]/10 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex items-center justify-center min-h-[300px]">
          <EmptyState
            icon={<FolderTree className="w-8 h-8 text-gray-400" />}
            title="No Categories Available"
            description="Create categories to organize your store inventory items."
            actionText="Add First Category"
            onAction={openAddModal}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Mobile Card list / Desktop Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] uppercase font-bold tracking-wider text-gray-400 font-body bg-gray-50/50">
                  <th className="p-4 w-12 text-center">Color</th>
                  <th className="p-4">Category Details</th>
                  <th className="p-4 text-center w-24">Sort Order</th>
                  <th className="p-4 text-center w-24">Status</th>
                  <th className="p-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-body text-gray-700">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/30">
                    <td className="p-4 text-center">
                      <span
                        className="w-5 h-5 rounded-full inline-block border border-gray-200/50 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      <span className="text-xl mr-2" role="img" aria-label={cat.name}>
                        {cat.icon || '📦'}
                      </span>
                      <span>{cat.name}</span>
                    </td>
                    <td className="p-4 text-center font-semibold text-gray-500">
                      {cat.sort_order}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        className={`transition-colors focus:outline-none ${
                          cat.is_active ? 'text-[#0f766e]' : 'text-gray-350'
                        }`}
                      >
                        {cat.is_active ? (
                          <ToggleRight className="w-10 h-6 stroke-[1.5]" />
                        ) : (
                          <ToggleLeft className="w-10 h-6 stroke-[1.5]" />
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 text-gray-450 hover:text-[#0f766e] hover:bg-gray-150 rounded-lg transition-colors inline-block"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cat.id)}
                        className="p-2 text-gray-455 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-6 animate-zoom-in">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-gray-450 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 font-heading mb-4">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                  placeholder="e.g. Desserts, Beverages"
                />
              </div>

              {/* Emoji Icon */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Emoji Icon
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
                  placeholder="e.g. 🍰, 🥤, 💊"
                />
              </div>

              {/* Color Swatches Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 font-body">
                  Theme Color Selection
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorSwatches.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${
                        color === c ? 'border-gray-900 scale-105' : 'border-transparent hover:scale-102'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 font-body">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
                  placeholder="e.g. 0"
                />
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
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Category"
        message="Are you sure you want to delete this category? All products under it will have their category unassigned."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
