// src/components/pos/ProductGrid.tsx
import React from 'react'
import { Product } from '../../types'
import { formatCurrency } from '../../lib/utils'
import EmptyState from '../shared/EmptyState'
import { Package } from 'lucide-react'

interface ProductGridProps {
  products: Product[]
  onAddProduct: (product: Product) => void
  currencySymbol: string
}

export default function ProductGrid({
  products,
  onAddProduct,
  currencySymbol,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex items-center justify-center min-h-[300px]">
        <EmptyState
          icon={<Package className="w-8 h-8 text-gray-400" />}
          title="No Products Found"
          description="Try changing the category or adding new products to the inventory."
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-14.5rem)] pr-1 pb-4">
      {products.map((product) => {
        const available = product.is_available ?? true

        return (
          <button
            key={product.id}
            disabled={!available}
            onClick={() => onAddProduct(product)}
            className={`flex flex-col text-left bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all relative ${
              available
                ? 'hover:shadow-md active:scale-[0.97] hover:border-gray-200'
                : 'opacity-60 cursor-not-allowed bg-gray-50'
            }`}
          >
            {/* Image section */}
            <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center relative border-b border-gray-100 shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center text-gray-300">
                  <Package className="w-8 h-8" />
                  <span className="text-[10px] uppercase font-bold tracking-wider mt-1">{product.unit || 'pc'}</span>
                </div>
              )}

              {/* Availability tag */}
              {!available && (
                <span className="absolute top-2 right-2 bg-red-500 text-white font-bold text-[9px] tracking-wide uppercase px-2 py-0.5 rounded-full border border-red-400/20 shadow-sm">
                  Unavailable
                </span>
              )}
            </div>

            {/* Info details */}
            <div className="p-3.5 flex flex-col justify-between flex-1 min-h-[80px]">
              <h4 className="font-bold text-gray-800 text-sm font-heading line-clamp-2 leading-snug">
                {product.name}
              </h4>
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs font-semibold font-body text-gray-400">
                  Per {product.unit || 'pc'}
                </span>
                <span className="font-bold text-gray-900 text-sm font-body">
                  {formatCurrency(product.price, currencySymbol)}
                </span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
