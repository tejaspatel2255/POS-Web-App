import { useState, useEffect } from 'react'
import { useCategories, useProducts } from '@/hooks/useProducts'
import { useCreateOrder } from '@/hooks/useOrders'
import { useAuth } from '@/contexts/AuthContext'
import { useCartStore } from '@/store/useCartStore'
import { formatCurrency, cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Trash2, ShoppingCart, Loader2, X, Search } from 'lucide-react'
import InvoiceModal from '@/components/pos/InvoiceModal'

const ORDER_TYPES = [
  { id: 'dine_in', label: 'Dine In' },
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'parcel', label: 'Parcel' },
  { id: 'delivery', label: 'Delivery By' },
]

export default function Billing() {
  const { profile } = useAuth()
  const { data: categories = [], isLoading: loadingCategories } = useCategories()
  
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  
  // Auto-select first category when loaded
  if (categories.length > 0 && !activeCategoryId) {
    setActiveCategoryId(categories[0].id)
  }
  
  const { data: products = [], isLoading: loadingProducts } = useProducts(activeCategoryId || undefined)
  const createOrder = useCreateOrder()
  
  const {
    items, orderType, discountPercent, parcelCharges,
    addItem, removeItem, updateQuantity, updateItemDiscount,
    setOrderType, setGlobalDiscount, setParcelCharges, clearCart,
    subtotal, totalDiscount, total,
    heldCarts, holdCurrentCart, resumeCart, deleteHeldCart
  } = useCartStore()

  const [paymentMethod, setPaymentMethod] = useState<'cash'|'card'|'upi'>('cash')
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [showInvoice, setShowInvoice] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string>('')
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  // Reset search when active category changes
  useEffect(() => {
    setProductSearch('')
  }, [activeCategoryId])

  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F8') {
        e.preventDefault()
        if (items.length > 0) {
          handleSaveOrder('completed', true)
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        clearCart()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, orderType, paymentMethod, discountPercent, parcelCharges])

  const handleSaveOrder = async (status: 'completed' | 'pending' | 'on_hold', print: boolean = false) => {
    if (items.length === 0) return
    
    try {
      const order = await createOrder.mutateAsync({
        order: {
          cashier_id: profile?.id,
          order_type: orderType,
          status,
          payment_method: paymentMethod,
          subtotal: subtotal(),
          discount_percent: discountPercent,
          discount_amount: totalDiscount(),
          parcel_charges: parcelCharges,
          total: total(),
        },
        items: items.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price || 0,
          line_total: (i.price || 0) * i.quantity * (1 - i.discount_percent / 100)
        }))
      })
      
      setLastOrderId(order.id)
      setCashReceived(0) // Reset change calculator
      
      if (print) {
        setShowInvoice(true)
      } else {
        clearCart()
        alert(order.offline ? 'Offline Order Queued Locally!' : 'Order placed successfully!')
      }
    } catch (error) {
      console.error('Failed to create order', error)
      alert('Failed to place order.')
    }
  }

  const handleInvoiceClose = () => {
    setShowInvoice(false)
    clearCart()
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Top Bar - Order Types */}
      <div className="bg-white/70 backdrop-blur-md p-2 lg:p-4 border-b flex flex-wrap gap-2 lg:gap-4 justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 hide-scrollbar">
          {ORDER_TYPES.map(type => (
            <Button
              key={type.id}
              variant={orderType === type.id ? 'default' : 'outline'}
              className={cn(
                "rounded-full whitespace-nowrap min-w-[100px]",
                orderType === type.id ? "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90" : "bg-white"
              )}
              onClick={() => setOrderType(type.id)}
            >
              {type.label}
            </Button>
          ))}
        </div>

        {/* Product Search Bar */}
        <div className="relative w-full lg:w-72 mt-2 lg:mt-0">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-9 bg-white h-9 rounded-lg border-primary/20 text-sm"
          />
        </div>
        
        {/* Mobile Cart Toggle */}
        <Button 
          className="lg:hidden fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-xl bg-primary hover:bg-primary/90 z-40"
          onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6 text-white" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-destructive text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-primary">
                {items.length}
              </span>
            )}
          </div>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Categories */}
        <div className="w-24 lg:w-48 xl:w-64 bg-white/50 backdrop-blur-sm border-r overflow-y-auto hide-scrollbar shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          {loadingCategories ? (
            <div className="p-4 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="flex flex-col p-2 space-y-2">
              {categories.map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategoryId(category.id)}
                  className={cn(
                    "p-3 lg:p-4 text-center lg:text-left rounded-xl transition-all duration-300 border",
                    activeCategoryId === category.id 
                      ? "active-category border-primary/20" 
                      : "bg-white/80 hover:bg-white border-transparent shadow-sm hover:shadow text-foreground font-medium"
                  )}
                >
                  <span className="text-xs lg:text-sm font-semibold tracking-wide break-words">{category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center Panel - Products */}
        <div className="flex-1 overflow-y-auto p-4 bg-background/50">
          {loadingProducts ? (
            <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4 auto-rows-max">
              {filteredProducts.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  className="glass-card flex flex-col items-center justify-center p-4 h-32 lg:h-40 rounded-2xl group active:scale-95 transition-transform"
                >
                  <div className="text-sm lg:text-base font-bold font-poppins text-primary text-center group-hover:text-secondary transition-colors mb-2 line-clamp-3">
                    {product.name}
                  </div>
                  <div className="text-xs lg:text-sm text-muted-foreground font-semibold bg-white px-3 py-1 rounded-full border shadow-sm">
                    {formatCurrency(product.price || 0)}
                  </div>
                </button>
              ))}
              {products.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <span className="text-4xl mb-4">🍨</span>
                  <p>No products in this category.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Cart (Hidden on mobile unless toggled) */}
        <div className={cn(
          "bg-white border-l flex flex-col shadow-2xl transition-all duration-300 lg:w-[400px] xl:w-[450px] shrink-0",
          "fixed inset-y-0 right-0 z-30 w-full sm:w-[400px] lg:static lg:block",
          isMobileCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Cart Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
            <h2 className="font-bold font-poppins text-lg">Current Order</h2>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={holdCurrentCart} 
                  className="text-white bg-white/10 hover:bg-white/20 text-xs px-2.5 h-8 font-semibold"
                >
                  Hold Order
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileCartOpen(false)} 
                className="lg:hidden text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Held Carts Notification/Recall Area */}
          {heldCarts.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200/60 p-3 text-xs space-y-1.5 shadow-inner shrink-0">
              <div className="font-bold text-amber-800 flex justify-between items-center">
                <span>⚠️ Parked Orders ({heldCarts.length})</span>
              </div>
              <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                {heldCarts.map((hc, idx) => (
                  <div key={hc.id} className="flex items-center justify-between bg-white border border-amber-200/80 rounded-lg p-2 shadow-sm">
                    <span className="font-medium text-amber-900">
                      #{idx + 1} - {hc.items.length} items ({hc.orderType.replace('_', ' ')})
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => resumeCart(hc.id)} 
                        className="text-primary font-bold hover:underline hover:text-primary/80 transition-colors"
                      >
                        Resume
                      </button>
                      <button 
                        onClick={() => deleteHeldCart(hc.id)} 
                        className="text-destructive font-bold hover:underline hover:text-destructive/80 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-auto bg-gray-50/50 p-2 lg:p-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-gray-300" />
                </div>
                <p className="font-medium">Cart is empty</p>
                <p className="text-sm text-center px-8">Tap on products to add them to the order.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <Card key={item.cart_item_id} className="p-3 border-white/60 shadow-sm hover:shadow transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                        <div className="font-semibold text-sm">{item.name}</div>
                      </div>
                      <div className="font-bold text-primary">{((item.price || 0) * item.quantity).toFixed(2)}</div>
                    </div>
                    
                    <div className="flex items-center justify-between pl-6">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white shadow-sm" onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white shadow-sm" onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-muted-foreground">Dis%</span>
                          <Input 
                            type="number" 
                            className="w-14 h-7 text-xs px-1 text-center bg-white" 
                            value={item.discount_percent || ''} 
                            onChange={(e) => updateItemDiscount(item.cart_item_id, Number(e.target.value))}
                            min="0" max="100"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md" onClick={() => removeItem(item.cart_item_id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border-t p-4 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{subtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-red-600">
                <span className="flex items-center gap-2">
                  Discount
                  <Input 
                    type="number" 
                    className="w-16 h-7 text-xs border-red-200" 
                    placeholder="%" 
                    value={discountPercent || ''}
                    onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                  />
                </span>
                <span>-{totalDiscount().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-2">
                  Parcel Charge
                  <Input 
                    type="number" 
                    className="w-20 h-7 text-xs" 
                    placeholder="₹" 
                    value={parcelCharges || ''}
                    onChange={(e) => setParcelCharges(Number(e.target.value))}
                  />
                </span>
                <span>{parcelCharges.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-2xl text-primary border-t pt-3 mt-3">
                <span>TOTAL</span>
                <span>{formatCurrency(total())}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['cash', 'card', 'upi'] as const).map(method => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  size="sm"
                  className={cn("capitalize", paymentMethod === method && "bg-secondary text-secondary-foreground")}
                  onClick={() => {
                    setPaymentMethod(method)
                    if (method !== 'cash') setCashReceived(0)
                  }}
                >
                  {method}
                </Button>
              ))}
            </div>

            {/* Quick Cash Calculator */}
            {paymentMethod === 'cash' && items.length > 0 && (
              <div className="bg-amber-50/40 border border-amber-200/40 rounded-xl p-3 mb-4 space-y-2">
                <div className="text-xs font-bold text-primary tracking-wide">CASH CALCULATOR</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Cash Received..."
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="bg-white h-9"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-9 shrink-0 border-primary/20 text-primary hover:bg-primary/5"
                    onClick={() => setCashReceived(total())}
                  >
                    Exact
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  {[100, 200, 500].map(amt => (
                    <Button 
                      key={amt} 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs bg-white border border-gray-200/60 font-semibold shadow-sm hover:bg-gray-50 flex-1" 
                      onClick={() => setCashReceived(amt)}
                    >
                      ₹{amt}
                    </Button>
                  ))}
                </div>
                {cashReceived > 0 && (
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-amber-200/80">
                    <span className="font-semibold text-muted-foreground">Change to return:</span>
                    <span className={cn(
                      "font-bold text-lg", 
                      cashReceived >= total() ? "text-green-600" : "text-destructive animate-pulse"
                    )}>
                      {cashReceived >= total() ? formatCurrency(cashReceived - total()) : "Insufficient Cash"}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-12 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => handleSaveOrder('pending')}
                disabled={items.length === 0}
              >
                Pending
              </Button>
              <Button 
                variant="outline" 
                className="h-12 border-secondary/50 text-secondary-foreground hover:bg-secondary/10"
                onClick={() => handleSaveOrder('on_hold')}
                disabled={items.length === 0}
              >
                On Hold
              </Button>
              <Button 
                className="h-14 font-bold text-lg bg-green-600 hover:bg-green-700 shadow-md"
                onClick={() => handleSaveOrder('completed')}
                disabled={items.length === 0}
              >
                Save
              </Button>
              <Button 
                className="h-14 font-bold text-lg shadow-md"
                onClick={() => handleSaveOrder('completed', true)}
                disabled={items.length === 0}
              >
                Save & Print
              </Button>
            </div>
            
            <Button variant="ghost" className="w-full mt-2 text-destructive hover:bg-destructive/10" onClick={clearCart} disabled={items.length === 0}>
              Cancel Order
            </Button>
          </div>
        </div>
      </div>
      
      <InvoiceModal 
        isOpen={showInvoice} 
        onClose={handleInvoiceClose} 
        orderId={lastOrderId}
        cashierName={profile?.full_name || 'Staff'} 
      />
    </div>
  )
}
