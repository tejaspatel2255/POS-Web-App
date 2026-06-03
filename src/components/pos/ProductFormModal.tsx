// File Path: d:/Projects/Web/Universal POS/src/components/pos/ProductFormModal.tsx

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Product, Category } from '@/types'

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(50, 'Name is too long'),
  category_id: z.string().nullable().optional(),
  price: z.preprocess((val) => Number(val), z.number().min(0, 'Price must be 0 or greater')),
  cost_price: z.preprocess((val) => Number(val), z.number().min(0, 'Cost price must be 0 or greater')),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  unit: z.string().default('pcs'),
  sort_order: z.preprocess((val) => Number(val), z.number().min(0, 'Must be positive')),
  is_available: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>

const UNIT_OPTIONS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'plate', 'box', 'cup', 'pack']

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: ProductFormValues) => void
  product?: Product | null
  categories: Category[]
  currencySymbol?: string
  loading?: boolean
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
  currencySymbol = '₹',
  loading = false,
}: ProductFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: null,
      price: 0,
      cost_price: 0,
      description: '',
      image_url: '',
      barcode: '',
      unit: 'pcs',
      sort_order: 0,
      is_available: true,
    },
  })

  const imageUrl = watch('image_url')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
    if (product) {
      reset({
        name: product.name,
        category_id: product.category_id,
        price: product.price,
        cost_price: product.cost_price,
        description: product.description || '',
        image_url: product.image_url || '',
        barcode: product.barcode || '',
        unit: product.unit || 'pcs',
        sort_order: product.sort_order,
        is_available: product.is_available,
      })
    } else {
      reset({
        name: '',
        category_id: categories.length > 0 ? categories[0].id : null,
        price: 0,
        cost_price: 0,
        description: '',
        image_url: '',
        barcode: '',
        unit: 'pcs',
        sort_order: 0,
        is_available: true,
      })
    }
  }, [product, reset, isOpen, categories])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-muted overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold font-poppins text-foreground">
            {product ? 'Edit Product' : 'Add New Product'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Column: Core Fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Product Name *</label>
                <Input
                  placeholder="e.g. Vanilla Scoop"
                  {...register('name')}
                  disabled={loading}
                />
                {errors.name && <p className="text-xs font-semibold text-destructive">{(errors.name as any)?.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('category_id')}
                  disabled={loading}
                >
                  <option value="">Unassigned</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="text-xs font-semibold text-destructive">{(errors.category_id as any)?.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Price ({currencySymbol}) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('price')}
                    disabled={loading}
                  />
                  {errors.price && <p className="text-xs font-semibold text-destructive">{(errors.price as any)?.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Cost Price ({currencySymbol})</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('cost_price')}
                    disabled={loading}
                  />
                  {errors.cost_price && <p className="text-xs font-semibold text-destructive">{(errors.cost_price as any)?.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Unit</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('unit')}
                    disabled={loading}
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
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
            </div>

            {/* Right Column: Media, Barcode & Options */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Barcode / SKU</label>
                <Input
                  placeholder="Scan or enter code"
                  {...register('barcode')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Image URL</label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  {...register('image_url')}
                  disabled={loading}
                />
              </div>

              {/* Live Image Preview */}
              <div className="h-28 border border-dashed rounded-xl flex items-center justify-center bg-muted/20 relative overflow-hidden">
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="text-center text-muted-foreground flex flex-col items-center gap-1.5 p-2">
                    <ImageIcon className="w-8 h-8 text-muted/80 animate-pulse" />
                    <span className="text-[10px] font-semibold">Image Preview Unavailable</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  className="w-full p-2.5 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
                  placeholder="Product description..."
                  {...register('description')}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
            <div>
              <p className="text-sm font-semibold text-foreground">In Stock & Available</p>
              <p className="text-xs text-muted-foreground">Show this product on the POS billing screen for cashiers</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 accent-primary cursor-pointer"
              {...register('is_available')}
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
              {loading ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
