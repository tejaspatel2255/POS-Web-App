// File Path: d:/Projects/Web/Universal POS/src/pages/billing/BillingScreen.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/cartStore'
import { useOfflineProducts } from '@/hooks/useOfflineProducts'
import { useOfflineOrder } from '@/hooks/useOfflineOrder'
import { supabase } from '@/lib/supabaseClient'
import CategoryPanel from '@/components/pos/CategoryPanel'
import ProductGrid from '@/components/pos/ProductGrid'
import CartPanel from '@/components/pos/CartPanel'
import InvoiceModal from '@/components/pos/InvoiceModal'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import type { Product } from '@/types'

const ORDER_TYPES = [
  { id: 'walk_in', label: 'Walk In', icon: '🚶' },
  { id: 'dine_in', label: 'Dine In', icon: '🍽️' },
  { id: 'takeaway', label: 'Takeaway', icon: '🛍️' },
  { id: 'parcel', label: 'Parcel', icon: '📦' },
  { id: 'delivery', label: 'Delivery', icon: '🛵' },
]

export default function BillingScreen() {
  const navigate = useNavigate()
  const { user, activeStore } = useAuth()
  
  // Offline State & Products/Categories hook
  const { products, categories, loading, isFromCache } = useOfflineProducts(activeStore?.id)
  const { submitOrder } = useOfflineOrder()
  
  const {
    items,
    discountPercent,
    parcelCharges,
    addItem,
    clearCart,
    subtotal: getSubtotal,
    totalDiscount: getTotalDiscount,
  } = useCartStore()

  // Selected state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedOrderType, setSelectedOrderType] = useState<string>('walk_in')
  
  // Enabled order types from store settings
  const [enabledTypes, setEnabledTypes] = useState<Record<string, boolean>>({
    walk_in: true,
    dine_in: true,
    takeaway: true,
    parcel: true,
    delivery: true,
  })

  // Responsive mobile cart state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  // Invoice Modal State
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null)

  // Query order types configuration from store settings
  useEffect(() => {
    if (!activeStore) return

    const fetchOrderTypes = async () => {
      try {
        const { data } = await (supabase
          .from('store_settings') as any)
          .select('value')
          .eq('store_id', activeStore.id)
          .eq('key', 'order_types')
          .maybeSingle()

        if (data?.value) {
          try {
            const parsed = JSON.parse(data.value)
            setEnabledTypes(parsed)
            // Find first enabled type to auto-select
            const firstEnabled = Object.entries(parsed).find(([_, enabled]) => enabled)
            if (firstEnabled) {
              setSelectedOrderType(firstEnabled[0])
            }
          } catch (_) {}
        }
      } catch (err) {
        console.error('Failed to load order type settings:', err)
      }
    }

    fetchOrderTypes()
  }, [activeStore])

  if (!activeStore) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-semibold">
        No active store selected. Please select or create a store.
      </div>
    )
  }

  if (loading) {
    return <LoadingSkeleton variant="card" count={6} />
  }

  // Filter products by active category selection
  const categoryProducts = selectedCategoryId
    ? products.filter((p) => p.category_id === selectedCategoryId)
    : products

  // Filter out disabled order types
  const visibleOrderTypes = ORDER_TYPES.filter((type) => enabledTypes[type.id] !== false)

  const handleAddCartItem = (product: Product) => {
    addItem(product)
  }

  const handleCheckout = async (
    status: 'pending' | 'completed' | 'on_hold',
    saveAndPrint: boolean,
    paymentMethod: 'cash' | 'card' | 'upi' | 'other'
  ) => {
    try {
      const subtotal = getSubtotal()
      const discountAmount = getTotalDiscount()
      const taxRate = activeStore.tax_rate || 0
      const taxableAmount = Math.max(0, subtotal - discountAmount)
      const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2))
      const total = taxableAmount + taxAmount + parcelCharges

      const orderPayload = {
        store_id: activeStore.id,
        cashier_id: user?.id || null,
        order_type: selectedOrderType,
        status,
        payment_method: paymentMethod,
        customer_name: null,
        customer_phone: null,
        subtotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        parcel_charges: parcelCharges,
        tax_amount: taxAmount,
        total,
        note: null,
      }

      const itemsPayload = items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        discount_percent: item.discount_percent,
        line_total: item.price * (1 - item.discount_percent / 100) * item.quantity,
      }))

      // Submit through offline-aware engine
      await submitOrder({
        order: orderPayload,
        items: itemsPayload,
      })

      // Construct dummy order record for receipt printing modal fallback
      const receiptOrder = {
        ...orderPayload,
        id: Math.random().toString(),
        created_at: new Date().toISOString(),
        order_number: 'OFF-' + Math.floor(1000 + Math.random() * 9000),
        items: itemsPayload.map((item) => ({
          ...item,
          id: Math.random().toString(),
          order_id: '',
          created_at: new Date().toISOString(),
        })),
      }

      clearCart()
      setIsMobileCartOpen(false)

      if (saveAndPrint) {
        setInvoiceOrder(receiptOrder)
      }
    } catch (err) {
      console.error('Checkout failed:', err)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-6.5rem)] overflow-hidden space-y-4 relative select-none">
      
      {/* Top Bar: Order Type Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-white/40 p-2 rounded-xl border border-white/50 shadow-sm flex-shrink-0 scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 flex-shrink-0">Order Type:</span>
        {visibleOrderTypes.map((type) => {
          const isSelected = selectedOrderType === type.id
          return (
            <button
              key={type.id}
              onClick={() => setSelectedOrderType(type.id)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold font-poppins border transition-all flex items-center gap-1.5"
              style={
                isSelected
                  ? { backgroundColor: activeStore.theme_color, color: '#ffffff', borderColor: activeStore.theme_color }
                  : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#64748b' }
              }
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          )
        })}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title="POS Setup Required"
          message="You need to configure menu categories and products before you can start billing."
          actionLabel="Go to Menu Management"
          onAction={() => navigate('/menu')}
        />
      ) : (
        /* Main Billing Layout Content */
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0 relative">
          
          {/* Desktop Left: Category Panel (horizontal scrolling on mobile, vertical sidebar on desktop) */}
          <div className="hidden lg:block flex-shrink-0">
            <CategoryPanel
              categories={categories}
              activeCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              themeColor={activeStore.theme_color}
            />
          </div>

          {/* Mobile view of Category Panel */}
          <div className="lg:hidden fixed bottom-18 left-4 z-20 flex gap-2">
            {/* We will let category selection stay at the left sidebar or at the top of products grid. Let's make it inline on top for mobile! */}
          </div>

          {/* Center Column: Product Browser Catalog & Mobile Category list */}
          <div className="flex-1 flex flex-col space-y-3 min-w-0">
            {/* Mobile-only horizontal category slider */}
            <div className="lg:hidden flex-shrink-0">
              <CategoryPanel
                categories={categories}
                activeCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                themeColor={activeStore.theme_color}
              />
            </div>

            <ProductGrid
              products={categoryProducts}
              onAddCartItem={handleAddCartItem}
              currencySymbol={activeStore.currency_symbol}
            />
          </div>

          {/* Desktop Right Column: Cart Panel */}
          <div className="hidden lg:block flex-shrink-0">
            <CartPanel
              activeStore={activeStore}
              onCheckout={handleCheckout}
            />
          </div>

          {/* Mobile Floating Cart Summary Drawer Trigger Button */}
          {items.length > 0 && (
            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="lg:hidden fixed bottom-20 right-4 z-30 shadow-xl text-white px-5 py-3 rounded-full flex items-center gap-2 font-bold animate-bounce transition-all"
              style={{ backgroundColor: activeStore.theme_color }}
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Cart ({items.reduce((sum, i) => sum + i.quantity, 0)})</span>
            </button>
          )}

          {/* Mobile Cart Overlay Slide-up Sheet */}
          {isMobileCartOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                onClick={() => setIsMobileCartOpen(false)}
              />
              {/* Slide-up Container */}
              <div className="bg-white rounded-t-3xl relative z-50 p-4 max-h-[85vh] overflow-hidden flex flex-col border-t shadow-2xl animate-in slide-in-from-bottom duration-250">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" onClick={() => setIsMobileCartOpen(false)} />
                <div className="overflow-y-auto flex-1 pb-4">
                  <CartPanel
                    activeStore={activeStore}
                    onCheckout={handleCheckout}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Invoice Modal for receipt preview and printing */}
      {invoiceOrder && (
        <InvoiceModal
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          order={invoiceOrder}
          store={activeStore}
        />
      )}

      {/* Cache notification indicator */}
      {isFromCache && (
        <div className="absolute bottom-2 left-2 bg-yellow-100 border border-yellow-200 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs flex items-center gap-1">
          <span>⚠️ Showing Offline Cached Catalog</span>
        </div>
      )}
    </div>
  )
}
