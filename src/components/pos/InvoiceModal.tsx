// src/components/pos/InvoiceModal.tsx
import React from 'react'
import { X, Printer, Share2, MessageCircle } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  order: {
    id: string
    order_number: string | number
    created_at: string
    cashier_name?: string
    order_type: string
    payment_method: string
    customer_name?: string
    customer_phone?: string
    subtotal: number
    discount_percent: number
    discount_amount: number
    parcel_charges: number
    tax_amount: number
    total: number
    note?: string
    items: any[]
  }
  store: any
}

export default function InvoiceModal({ isOpen, onClose, order, store }: InvoiceModalProps) {
  if (!isOpen) return null

  const currencySymbol = store?.currency_symbol || '₹'

  const handlePrint = () => {
    window.print()
  }

  const buildWhatsAppText = () => {
    let text = `*${store?.name || 'Store Receipt'}*\n`
    if (store?.address) text += `${store.address}\n`
    if (store?.phone) text += `Ph: ${store.phone}\n`
    text += `============================\n`
    text += `Order No: #${order.order_number}\n`
    text += `Date: ${new Date(order.created_at).toLocaleString()}\n`
    text += `Cashier: ${order.cashier_name || 'Staff'}\n`
    text += `Type: ${order.order_type.toUpperCase()}\n`
    text += `============================\n`
    
    order.items.forEach((item: any) => {
      const lineTotal = item.line_total ?? (item.quantity * item.price)
      text += `${item.product_name}\n`
      text += `  ${item.quantity} x ${currencySymbol}${item.price || item.unit_price} = ${currencySymbol}${lineTotal}\n`
    })

    text += `============================\n`
    text += `Subtotal: ${currencySymbol}${order.subtotal}\n`
    if (order.discount_percent > 0) {
      text += `Discount (${order.discount_percent}%): -${currencySymbol}${order.discount_amount}\n`
    }
    if (order.parcel_charges > 0) {
      text += `Parcel Charges: +${currencySymbol}${order.parcel_charges}\n`
    }
    if (order.tax_amount > 0) {
      text += `Tax: +${currencySymbol}${order.tax_amount}\n`
    }
    text += `*TOTAL BILL: ${currencySymbol}${order.total}*\n`
    text += `============================\n`
    text += `Payment: ${order.payment_method.toUpperCase()}\n`
    if (order.note) text += `Note: ${order.note}\n`
    text += `============================\n`
    text += `${store?.receipt_footer || 'Thank you for visiting!'}`

    return encodeURIComponent(text)
  }

  const handleWhatsAppShare = () => {
    const text = buildWhatsAppText()
    const phone = order.customer_phone || ''
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-gray-150 flex flex-col max-h-[90vh] overflow-hidden animate-zoom-in">
        {/* Header Controls */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50 print:hidden">
          <h3 className="font-bold text-gray-900 font-heading">Receipt Invoice</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-950 hover:bg-gray-150 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable thermal receipt view */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div
            id="receipt-print-area"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-mono text-xs text-gray-800 leading-relaxed max-w-[80mm] mx-auto"
          >
            {/* Store Information */}
            <div className="text-center space-y-1 mb-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{store?.name}</h2>
              {store?.tagline && <p className="text-[10px] text-gray-500 italic">{store.tagline}</p>}
              {store?.address && <p className="text-[10px] text-gray-500">{store.address}</p>}
              {store?.phone && <p className="text-[10px] text-gray-500">Ph: {store.phone}</p>}
            </div>

            <div className="border-t border-dashed border-gray-250 py-2.5 space-y-1 text-[10px]">
              <div>Order No: #{order.order_number}</div>
              <div>Date: {new Date(order.created_at).toLocaleString()}</div>
              <div>Cashier: {order.cashier_name || 'Staff'}</div>
              <div>Type: {order.order_type.toUpperCase()}</div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-[10px] border-t border-dashed border-gray-250 mt-2">
              <thead>
                <tr className="border-b border-dashed border-gray-250 font-bold text-gray-900">
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center w-8">Qty</th>
                  <th className="py-2 text-right w-16">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-200">
                {order.items.map((item: any, idx: number) => {
                  const itemPrice = item.price || item.unit_price || 0
                  const lineTotal = item.line_total ?? (item.quantity * itemPrice)
                  return (
                    <tr key={idx} className="align-top">
                      <td className="py-2 pr-1">{item.product_name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(lineTotal, currencySymbol)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals Section */}
            <div className="border-t border-dashed border-gray-250 pt-2.5 mt-2 space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, currencySymbol)}</span>
              </div>
              {order.discount_percent > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount ({order.discount_percent}%)</span>
                  <span>-{formatCurrency(order.discount_amount, currencySymbol)}</span>
                </div>
              )}
              {order.parcel_charges > 0 && (
                <div className="flex justify-between">
                  <span>Parcel Charges</span>
                  <span>+{formatCurrency(order.parcel_charges, currencySymbol)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>+{formatCurrency(order.tax_amount, currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-gray-900 pt-1.5 border-t border-dashed border-gray-200">
                <span>TOTAL BILL</span>
                <span>{formatCurrency(order.total, currencySymbol)}</span>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="border-t border-dashed border-gray-250 pt-3 mt-4 text-center space-y-1 text-[9px] text-gray-500">
              <div>Payment: {order.payment_method.toUpperCase()}</div>
              {order.note && <div className="italic">Note: "{order.note}"</div>}
              <div className="font-bold uppercase tracking-wider mt-2.5">{store?.receipt_footer || 'THANK YOU FOR VISITING!'}</div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0 bg-white print:hidden">
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs font-body flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Share WhatsApp
          </button>
          
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-semibold text-xs font-body flex items-center justify-center gap-1.5 shadow-md shadow-[#0f766e]/10 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Global CSS Inject for Page Print Styling */}
      <style>{`
        @keyframes zoom-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-zoom-in {
          animation: zoom-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print-area, #receipt-print-area * {
            visibility: visible;
          }
          #receipt-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            border: none;
            box-shadow: none;
            padding: 0;
            margin: 0;
            background: white;
          }
        }
      `}</style>
    </div>
  )
}
