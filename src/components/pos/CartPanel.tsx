// File Path: d:/Projects/Web/Universal POS/src/components/pos/CartPanel.tsx

import { useState } from 'react'
import { Plus, Minus, Trash2, Tag, Truck } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatCurrency'
import type { Store } from '@/types'

const PAYMENT_METHODS = [
  { id: 'cash', label: '💵 Cash' },
  { id: 'upi', label: '📱 UPI' },
  { id: 'card', label: '💳 Card' },
  { id: 'other', label: '🏬 Other' },
]

interface CartPanelProps {
  activeStore: Store
  onCheckout: (
    status: 'pending' | 'completed' | 'on_hold',
    saveAndPrint: boolean,
    paymentMethod: 'cash' | 'card' | 'upi' | 'other'
  ) => void
  loading?: boolean
}

export default function CartPanel({
  activeStore,
  onCheckout,
  loading = false,
}: CartPanelProps) {
  const {
    items,
    discountPercent,
    parcelCharges,
    updateQty,
    updateItemDiscount,
    removeItem,
    applyDiscount,
    setParcelCharges,
    clearCart,
    subtotal: getSubtotal,
    totalDiscount: getTotalDiscount,
  } = useCartStore()

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'other'>('cash')

  const subtotal = getSubtotal()
  const discountAmount = getTotalDiscount()
  const taxRate = activeStore.tax_rate || 0
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const taxAmount = parseFloat((taxableAmount * (taxRate / 100)).toFixed(2))
  const finalTotal = taxableAmount + taxAmount + parcelCharges
  const symbol = activeStore.currency_symbol

  const handleCheckout = (status: 'pending' | 'completed' | 'on_hold', saveAndPrint = false) => {
    if (items.length === 0) return
    onCheckout(status, saveAndPrint, paymentMethod)
  }

  return (
    <div className="w-full lg:w-96 bg-white/40 border border-white/50 rounded-2xl p-4 flex flex-col h-full overflow-hidden shadow-sm">
      {/* Cart Header */}
      <div className="flex justify-between items-center pb-3 border-b border-muted/30 flex-shrink-0">
        <h3 className="text-sm font-bold font-poppins text-foreground flex items-center gap-1.5">
          🛒 Active Cart ({items.reduce((sum, i) => sum + i.quantity, 0)} items)
        </h3>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-[10px] uppercase font-bold text-destructive hover:underline min-h-[44px] px-2"
            disabled={loading}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items Table List */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0 select-none scrollbar-none">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full py-8 text-muted-foreground">
            <span className="text-3xl mb-1">🛒</span>
            <p className="text-xs font-semibold">Your cart is empty.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const netPrice = item.price * (1 - item.discount_percent / 100)
              const amount = netPrice * item.quantity

              return (
                <div
                  key={item.cart_item_id}
                  className="p-3 rounded-xl border border-white/50 bg-white/60 shadow-xs flex flex-col space-y-2 hover:bg-white/80 transition-colors"
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-bold text-foreground font-poppins truncate flex-1">
                      {index + 1}. {item.name}
                    </span>
                    <button
                      onClick={() => removeItem(item.cart_item_id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 gap-2 flex-wrap sm:flex-nowrap">
                    {/* Quantity Adjustment Buttons */}
                    <div className="flex items-center gap-1 bg-white border rounded-lg p-1 shadow-inner min-h-[44px]">
                      <button
                        onClick={() => updateQty(item.cart_item_id, item.quantity - 1)}
                        className="p-1.5 hover:bg-muted rounded text-foreground active:scale-90 transition-transform min-w-[32px] min-h-[32px] flex items-center justify-center"
                        disabled={loading}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.cart_item_id, item.quantity + 1)}
                        className="p-1.5 hover:bg-muted rounded text-foreground active:scale-90 transition-transform min-w-[32px] min-h-[32px] flex items-center justify-center"
                        disabled={loading}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Discount Input */}
                    <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-white shadow-inner min-h-[44px]">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        inputMode="numeric"
                        className="w-10 text-center text-xs border-none focus:outline-none p-0 mt-0.5"
                        value={item.discount_percent || ''}
                        onChange={(e) =>
                          updateItemDiscount(item.cart_item_id, parseInt(e.target.value) || 0)
                        }
                        disabled={loading}
                      />
                      <span className="text-[10px] text-muted-foreground pr-1">%</span>
                    </div>

                    {/* Item Price & Line Total */}
                    <div className="text-right flex-1 min-w-[80px]">
                      <div className="text-[9px] text-muted-foreground">Rate: {formatCurrency(item.price, symbol)}</div>
                      <div className="text-xs font-extrabold text-foreground">
                        {formatCurrency(amount, symbol)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart Summary & Checkout Footer */}
      <div className="border-t border-muted/30 pt-3 space-y-3 flex-shrink-0">
        {/* Global discount & Parcel charges fields - Stacked on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 border rounded-xl p-2 bg-white/60 border-white/50 shadow-xs min-h-[44px]">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none">Global Disc%</span>
              <input
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                className="w-full text-xs font-semibold focus:outline-none border-none p-0 mt-0.5 bg-transparent"
                value={discountPercent || ''}
                onChange={(e) => applyDiscount(parseInt(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 border rounded-xl p-2 bg-white/60 border-white/50 shadow-xs min-h-[44px]">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] uppercase font-bold text-muted-foreground block leading-none">Parcel Chg</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                className="w-full text-xs font-semibold focus:outline-none border-none p-0 mt-0.5 bg-transparent"
                value={parcelCharges || ''}
                onChange={(e) => setParcelCharges(parseFloat(e.target.value) || 0)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Pricing calculations details */}
        <div className="space-y-1 bg-white/30 border border-white/40 p-2.5 rounded-xl text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, symbol)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discounts</span>
              <span>-{formatCurrency(discountAmount, symbol)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tax ({taxRate}%)</span>
              <span>{formatCurrency(taxAmount, symbol)}</span>
            </div>
          )}
          {parcelCharges > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Parcel Charges</span>
              <span>{formatCurrency(parcelCharges, symbol)}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-foreground text-sm sm:text-base pt-1.5 border-t border-muted/20">
            <span>Total</span>
            <span>{formatCurrency(finalTotal, symbol)}</span>
          </div>
        </div>

        {/* Payment selector grid */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground">Payment Method</label>
          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id as any)}
                className={`py-2 rounded-full border text-center text-xs font-bold transition-all min-h-[44px] flex items-center justify-center ${
                  paymentMethod === method.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-white/50 bg-white hover:bg-white/80 text-muted-foreground'
                }`}
                disabled={loading}
              >
                {method.label.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button layout grid with responsive flex/order */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            onClick={() => handleCheckout('completed', true)}
            className="order-1 md:order-4 text-xs h-11 font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground min-h-[44px]"
            disabled={loading || items.length === 0}
          >
            Print & Complete
          </Button>

          <Button
            onClick={() => handleCheckout('completed')}
            className="order-2 md:order-3 text-xs h-11 font-bold bg-primary hover:bg-primary/90 min-h-[44px]"
            disabled={loading || items.length === 0}
          >
            Complete Order
          </Button>

          <Button
            variant="outline"
            className="order-3 md:order-2 text-xs h-11 font-bold min-h-[44px]"
            onClick={() => handleCheckout('pending')}
            disabled={loading || items.length === 0}
          >
            Save Pending
          </Button>

          <Button
            variant="outline"
            className="order-4 md:order-1 text-xs h-11 font-bold min-h-[44px]"
            onClick={() => handleCheckout('on_hold')}
            disabled={loading || items.length === 0}
          >
            Hold Bill
          </Button>

          <Button
            variant="outline"
            className="order-5 col-span-2 text-xs h-11 font-bold bg-destructive/10 hover:bg-destructive/20 border-destructive/20 text-destructive md:hidden min-h-[44px]"
            onClick={clearCart}
            disabled={loading || items.length === 0}
          >
            Cancel / Clear Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
