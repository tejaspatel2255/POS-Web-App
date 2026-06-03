// File Path: d:/Projects/Web/Universal POS/src/components/pos/CategoryFormModal.tsx

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Category } from '@/types'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(30, 'Name is too long'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().min(1, 'Emoji icon is required'),
  sort_order: z.preprocess((val) => Number(val), z.number().min(0, 'Must be positive')),
  is_active: z.boolean().default(true),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const COLOR_SWATCHES = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
]

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: CategoryFormValues) => void
  category?: Category | null
  loading?: boolean
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  loading = false,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: COLOR_SWATCHES[0],
      icon: '📁',
      sort_order: 0,
      is_active: true,
    },
  })

  const selectedColor = watch('color')

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        color: category.color,
        icon: category.icon,
        sort_order: category.sort_order,
        is_active: category.is_active,
      })
    } else {
      reset({
        name: '',
        color: COLOR_SWATCHES[0],
        icon: '📁',
        sort_order: 0,
        is_active: true,
      })
    }
  }, [category, reset, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-muted overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold font-poppins text-foreground">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Category Name *</label>
            <Input
              placeholder="e.g. Desserts, Beverages"
              {...register('name')}
              disabled={loading}
            />
            {errors.name && <p className="text-xs font-semibold text-destructive">{(errors.name as any)?.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Icon (Emoji) *</label>
              <Input
                placeholder="e.g. 🍦, 🍔, 🥤"
                {...register('icon')}
                disabled={loading}
              />
              {errors.icon && <p className="text-xs font-semibold text-destructive">{(errors.icon as any)?.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Sort Order</label>
              <Input
                type="number"
                {...register('sort_order')}
                disabled={loading}
              />
              {errors.sort_order && <p className="text-xs font-semibold text-destructive">{(errors.sort_order as any)?.message}</p>}
            </div>
          </div>

          {/* Color Picker Swatches */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase block">Branding Color *</label>
            <div className="grid grid-cols-5 gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                   key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`h-8 rounded-lg border-2 transition-all ${
                    selectedColor === color
                      ? 'border-foreground scale-105 shadow-sm'
                      : 'border-transparent hover:scale-102'
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={loading}
                />
              ))}
            </div>
            {errors.color && <p className="text-xs font-semibold text-destructive">{(errors.color as any)?.message}</p>}
          </div>

          {/* Active status toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
            <div>
              <p className="text-sm font-semibold text-foreground">Active Status</p>
              <p className="text-xs text-muted-foreground">Show this category on the POS billing screen</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 accent-primary cursor-pointer"
              {...register('is_active')}
              disabled={loading}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
