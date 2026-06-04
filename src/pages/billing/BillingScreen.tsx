// src/pages/billing/BillingScreen.tsx
import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useCategories } from '../../hooks/useCategories'
import { useProducts } from '../../hooks/useProducts'
import { useCart } from '../../store/cartStore'
import { useOfflineOrder } from '../../hooks/useOfflineOrder'
import CategoryPanel from '../../components/pos/CategoryPanel'
import ProductGrid from '../../components/pos/ProductGrid'
import CartPanel from '../../components/pos/CartPanel'
import InvoiceModal from '../../components/pos/InvoiceModal'
import { Search, ShoppingBag, X } from 'lucide-react'

const orderTypes = [
  { id: 'walk_in', label: 'Walk In' },
  { id: 'dine_in', label: 'Dine In' },
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'parcel', label: 'Parcel' },
  { id: 'delivery', label: 'Delivery' },
] as const

export default function BillingScreen() {
  const { activeStore, user } = useAuthStore()
  const storeId = activeStore?.id || ''
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [invoiceData, setInvoiceData] = useState<any | null>(null)

  const { data: categories = [] } = useCategories(storeId)
  const { data: products = [] } = useProducts(storeId, selectedCategoryId)
  const cart = useCart(storeId)
  const { submitOrder } = useOfflineOrder(storeId)

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  // Filter products by search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const handleCheckout = async (status: 'completed' | 'pending' | 'on_hold') => {
    if (cart.items.length === 0) return

    const cashierName = user?.user_metadata?.full_name || user?.email || 'Cashier'
    
    const orderPayload = {
      cashier_id: user?.id,
      cashier_name: cashierName,
      order_type: cart.orderType,
      status,
      payment_method: cart.paymentMethod,
      customer_name: undefined,
      customer_phone: undefined,
      subtotal: cart.subtotal,
      discount_percent: cart.discountPercent,
      discount_amount: cart.discountAmount,
      parcel_charges: cart.parcelCharges,
      tax_amount: Number((cart.subtotal * (activeStore?.tax_rate || 0) / 100).toFixed(2)),
      total: cart.total,
      note: cart.note,
      items: cart.items,
    }

    try {
      const response = await submitOrder(orderPayload)
      if (response?.success) {
        // Prepare data for the invoice
        setInvoiceData({
          ...orderPayload,
          id: response.orderId,
          order_number: Date.now().toString().slice(-6),
          created_at: new Date().toISOString()
        })
        cart.clearCart()
        setMobileCartOpen(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 relative">
      {/* Left panel & middle grid container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top filter bar: Order Type & Search */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
          {/* Order Type pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {orderTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => cart.setOrderType(type.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold font-body whitespace-nowrap transition-all ${
                  cart.orderType === type.id
                    ? 'text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: cart.orderType === type.id ? (activeStore?.theme_color || '#0f766e') : undefined
                }}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="block w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-250 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition-colors outline-none text-gray-900"
            />
          </div>
        </div>

        {/* Category List & Product Tiles */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
          <div className="shrink-0">
            <CategoryPanel
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              activeColor={activeStore?.theme_color || '#0f766e'}
            />
          </div>

          <div className="flex-1 min-h-0">
            <ProductGrid
              products={filteredProducts}
              onAddProduct={(p) => cart.addItem({
                product_id: p.id,
                product_name: p.name,
                price: Number(p.price),
                discount_percent: 0,
                unit: p.unit || 'pc'
              })}
              currencySymbol={activeStore?.currency_symbol || '₹'}
            />
          </div>
        </div>
      </div>

      {/* Right panel: Persistent Cart (Desktop only) */}
      <div className="hidden lg:block w-[340px] shrink-0 bg-white rounded-3xl border border-gray-100 shadow-md p-4 flex flex-col h-[calc(100vh-8.5rem)] sticky top-[5.5rem]">
        <CartPanel
          cart={cart}
          onCheckout={handleCheckout}
          currencySymbol={activeStore?.currency_symbol || '₹'}
        />
      </div>

      {/* Floating Cart Button (Mobile only) */}
      <button
        onClick={() => setMobileCartOpen(true)}
        className="fixed bottom-20 right-6 lg:hidden z-40 p-4 rounded-full text-white shadow-xl flex items-center gap-2 active:scale-95 transition-transform"
        style={{ backgroundColor: activeStore?.theme_color || '#0f766e' }}
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="bg-white text-gray-950 font-bold text-xs px-2 py-0.5 rounded-full border border-gray-100">
          {cart.items.reduce((total, i) => total + i.quantity, 0)}
        </span>
        <span className="font-bold text-sm">
          {activeStore?.currency_symbol || '₹'}{cart.total}
        </span>
      </button>

      {/* Mobile Cart Bottom Sheet */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileCartOpen(false)} />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col p-4 animate-slide-up pb-safe">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
              <h3 className="font-bold text-gray-900 font-heading flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#0f766e]" /> Selected Items
              </h3>
              <button
                onClick={() => setMobileCartOpen(false)}
                className="p-1 rounded-lg bg-gray-50 text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto">
              <CartPanel
                cart={cart}
                onCheckout={handleCheckout}
                currencySymbol={activeStore?.currency_symbol || '₹'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {invoiceData && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setInvoiceData(null)}
          order={invoiceData}
          store={activeStore}
        />
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
