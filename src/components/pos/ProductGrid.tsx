// File Path: d:/Projects/Web/Universal POS/src/components/pos/ProductGrid.tsx

import { useState, useMemo } from 'react'
import { Search, Inbox } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/formatCurrency'
import type { Product } from '@/types'

interface ProductGridProps {
  products: Product[]
  onAddCartItem: (product: Product) => void
  currencySymbol?: string
}

export default function ProductGrid({
  products,
  onAddCartItem,
  currencySymbol = '₹',
}: ProductGridProps) {
  const [search, setSearch] = useState('')

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [products, search])

  return (
    <div className="flex-1 flex flex-col space-y-3 h-full min-h-0">
      {/* Search Input - Sticky, 44px height */}
      <div className="relative sticky top-0 bg-background/95 backdrop-blur-xs z-10 pb-1">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
        <Input
          placeholder="Search items by name or scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 bg-white/50 border-white/50 font-medium"
        />
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto pr-1 scroll-smooth">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white/30 border border-white/40 rounded-2xl min-h-[250px]">
            <Inbox className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">No matching products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map((p) => {
              const handleAddClick = () => {
                if (p.is_available) {
                  onAddCartItem(p)
                }
              }

              return (
                <button
                  key={p.id}
                  onClick={handleAddClick}
                  disabled={!p.is_available}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all duration-200 min-h-[85px] h-28 ${
                    p.is_available
                      ? 'border-white/50 bg-white hover:bg-white/80 hover:shadow-md active:scale-97 cursor-pointer'
                      : 'border-muted/30 bg-muted/10 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="space-y-0.5 w-full">
                    <h4 className="text-xs font-bold text-foreground font-poppins line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                    {p.unit && (
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase block truncate">
                        {p.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between w-full">
                    <span className="text-xs sm:text-sm font-extrabold text-primary font-poppins">
                      {formatCurrency(p.price, currencySymbol)}
                    </span>
                    {!p.is_available && (
                      <span className="text-[8px] font-bold text-red-600 bg-red-50 border border-red-200 px-1 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                        Out Stock
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
