// src/components/pos/CartPanel.tsx
import React from 'react'
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, MoreHorizontal } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import EmptyState from '../shared/EmptyState'

interface CartPanelProps {
  cart: {
    items: any[]
    discountPercent: number
    parcelCharges: number
    orderType: string
    paymentMethod: 'cash' | 'card' | 'upi' | 'other'
    note: string
    subtotal: number
    discountAmount: number
    total: number
    addItem: (item: any) => void
    removeItem: (productId: string) => void
    updateQty: (productId: string, qty: number) => void
    clearCart: () => void
    setDiscount: (discount: number) => void
    setParcelCharges: (charges: number) => void
    setOrderType: (type: any) => void
    setPaymentMethod: (method: any) => void
    setNote: (note: string) => void
  }
  onCheckout: (status: 'completed' | 'pending' | 'on_hold') => Promise<void>
  currencySymbol: string
}

export default function CartPanel({ cart, onCheckout, currencySymbol }: CartPanelProps) {
  const handleQtyChange = (productId: string, currentQty: number, delta: number) => {
    cart.updateQty(productId, Math.max(1, currentQty + delta))
  }

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'upi', label: 'UPI', icon: QrCode },
    { id: 'other', label: 'Other', icon: MoreHorizontal },
  ] as const

  if (cart.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full">
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8 text-gray-300 animate-bounce" />}
          title="Empty Cart"
          description="Select products from the grid to add them here."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Scrollable Cart Items List */}
      <div className="flex-1 overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] uppercase font-bold tracking-wider text-gray-400 font-body">
              <th className="py-2 w-8">No</th>
              <th className="py-2">Item</th>
              <th className="py-2 text-center w-[90px]">Qty</th>
              <th className="py-2 text-right w-[75px]">Total</th>
              <th className="py-2 text-right w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm font-body">
            {cart.items.map((item, idx) => (
              <tr key={item.product_id} className="align-middle">
                <td className="py-3 text-gray-400 font-semibold">{idx + 1}</td>
                <td className="py-3 pr-2">
                  <span className="font-bold text-gray-800 line-clamp-2 leading-tight">
                    {item.product_name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                    {formatCurrency(item.price, currencySymbol)}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={() => handleQtyChange(item.product_id, item.quantity, -1)}
                      className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-950 active:scale-90 transition-transform"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-gray-800 text-xs w-6 text-center select-none">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQtyChange(item.product_id, item.quantity, 1)}
                      className="p-1 hover:bg-white rounded text-gray-500 hover:text-gray-950 active:scale-90 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td className="py-3 text-right font-bold text-gray-800 font-body">
                  {formatCurrency(item.price * item.quantity, currencySymbol)}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => cart.removeItem(item.product_id)}
                    className="p-1.5 text-gray-450 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cart Summary & Action Block */}
      <div className="border-t border-gray-100 pt-4 mt-4 bg-white space-y-4">
        
        {/* Discount & Parcel charges inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-body">
              Discount (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={cart.discountPercent || ''}
              onChange={(e) => cart.setDiscount(Number(e.target.value))}
              className="block w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 font-body">
              Parcel (Amt)
            </label>
            <input
              type="number"
              min="0"
              value={cart.parcelCharges || ''}
              onChange={(e) => cart.setParcelCharges(Number(e.target.value))}
              className="block w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-semibold"
            />
          </div>
        </div>

        {/* Note input */}
        <div>
          <input
            type="text"
            value={cart.note}
            onChange={(e) => cart.setNote(e.target.value)}
            placeholder="Add short note..."
            className="block w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0f766e] transition-colors outline-none text-gray-900 font-body"
          />
        </div>

        {/* Calculations */}
        <div className="space-y-1.5 border-b border-gray-100 pb-3.5 text-xs font-semibold font-body text-gray-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-gray-800">{formatCurrency(cart.subtotal, currencySymbol)}</span>
          </div>
          {cart.discountPercent > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount ({cart.discountPercent}%)</span>
              <span>-{formatCurrency(cart.discountAmount, currencySymbol)}</span>
            </div>
          )}
          {cart.parcelCharges > 0 && (
            <div className="flex justify-between">
              <span>Parcel Charges</span>
              <span className="text-gray-800">+{formatCurrency(cart.parcelCharges, currencySymbol)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-900 text-sm font-bold pt-1.5 border-t border-dashed border-gray-100">
            <span className="font-heading uppercase text-xs tracking-wider text-gray-500">Total Bill</span>
            <span className="text-base font-heading">{formatCurrency(cart.total, currencySymbol)}</span>
          </div>
        </div>

        {/* Payment Pills */}
        <div className="space-y-2">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
            Payment Method
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => cart.setPaymentMethod(pm.id)}
                className={`py-2 px-1 flex flex-col items-center justify-center rounded-xl border text-[9px] font-bold font-body transition-colors gap-1 ${
                  cart.paymentMethod === pm.id
                    ? 'border-[#0f766e] bg-[#0f766e]/5 text-[#0f766e] ring-1 ring-[#0f766e]'
                    : 'border-gray-150 bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <pm.icon className="w-4 h-4" />
                <span>{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={cart.clearCart}
            className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold font-body rounded-xl border border-gray-150 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onCheckout('on_hold')}
            className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold font-body rounded-xl transition-colors"
          >
            Hold
          </button>
          <button
            onClick={() => onCheckout('pending')}
            className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold font-body rounded-xl transition-colors"
          >
            Pending
          </button>
        </div>

        <button
          onClick={() => onCheckout('completed')}
          className="w-full py-3.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-sm shadow-md shadow-[#0f766e]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <span>Complete & Print</span>
        </button>
      </div>
    </div>
  )
}
