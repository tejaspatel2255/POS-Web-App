// File Path: d:/Projects/Web/Universal POS/src/components/pos/InvoiceModal.tsx

import { useRef } from 'react'
import { X, Printer, Share2 } from 'lucide-react'
import { formatCurrency } from '@/lib/formatCurrency'
import { Button } from '@/components/ui/button'
import type { Store, Order, OrderItem } from '@/types'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order & { items: OrderItem[] }
  store: Store
}

export default function InvoiceModal({ isOpen, onClose, order, store }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const sym = store.currency_symbol

  const handlePrint = () => {
    if (!printRef.current) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>Invoice #${order.order_number || order.id.slice(0, 8).toUpperCase()}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .row { display: flex; justify-content: space-between; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .store-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table td { padding: 1px 0; vertical-align: top; }
            .items-table .amt { text-align: right; white-space: nowrap; }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const handleWhatsApp = () => {
    const lines = [
      `*${store.name}*`,
      store.address ? store.address : '',
      store.phone ? `Ph: ${store.phone}` : '',
      '',
      `Order #${order.order_number || order.id.slice(0, 8).toUpperCase()}`,
      `Date: ${new Date(order.created_at).toLocaleString()}`,
      `Type: ${(order.order_type || '').replace(/_/g, ' ') || 'Walk In'}`,
      '──────────────',
      ...order.items.map(i => `${i.product_name} x${i.quantity}  ${formatCurrency(i.line_total, sym)}`),
      '──────────────',
      `Subtotal: ${formatCurrency(order.subtotal, sym)}`,
      order.discount_amount > 0 ? `Discount: -${formatCurrency(order.discount_amount, sym)}` : '',
      order.tax_amount > 0 ? `Tax: ${formatCurrency(order.tax_amount, sym)}` : '',
      order.parcel_charges > 0 ? `Parcel: ${formatCurrency(order.parcel_charges, sym)}` : '',
      `*Total: ${formatCurrency(order.total, sym)}*`,
      `Payment: ${(order.payment_method || '').toUpperCase()}`,
      '',
      store.receipt_footer || 'Thank you for your visit!',
    ].filter(Boolean).join('\n')

    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-muted overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Screen Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-bold font-poppins">Invoice Preview</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleWhatsApp} className="flex gap-1.5 text-xs">
              <Share2 className="w-3.5 h-3.5" /> WhatsApp
            </Button>
            <Button size="sm" onClick={handlePrint} className="flex gap-1.5 text-xs bg-primary hover:bg-primary/90">
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="overflow-y-auto flex-1 p-4">
          <div
            ref={printRef}
            className="font-mono text-xs mx-auto"
            style={{ width: '100%', maxWidth: '300px' }}
          >
            {/* Store Header */}
            <div className="text-center mb-3">
              {store.logo_url && (
                <img src={store.logo_url} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1 rounded" />
              )}
              <div className="text-base font-bold">{store.name}</div>
              {store.address && <div className="text-[10px] text-gray-600">{store.address}</div>}
              {store.phone && <div className="text-[10px] text-gray-600">Ph: {store.phone}</div>}
              {store.email && <div className="text-[10px] text-gray-600">{store.email}</div>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Order Meta */}
            <div className="text-[10px] space-y-0.5 mb-2">
              <div className="flex justify-between">
                <span>Order #:</span>
                <span className="font-bold">{order.order_number || order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="capitalize">{(order.order_type || '').replace(/_/g, ' ') || 'Walk In'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="capitalize font-bold">{(order.payment_method || '').toUpperCase()}</span>
              </div>
              {order.customer_name && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{order.customer_name}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Items Table */}
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <td className="font-bold pb-1">Item</td>
                  <td className="font-bold pb-1 text-center">Qty</td>
                  <td className="font-bold pb-1 text-right">Rate</td>
                  <td className="font-bold pb-1 text-right">Amt</td>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="pr-1 align-top py-0.5" style={{ maxWidth: '90px', wordBreak: 'break-word' }}>
                      {item.product_name}
                      {item.discount_percent > 0 && (
                        <span className="text-gray-500"> (-{item.discount_percent}%)</span>
                      )}
                    </td>
                    <td className="text-center py-0.5">{item.quantity}</td>
                    <td className="text-right py-0.5 whitespace-nowrap">{formatCurrency(item.unit_price, sym)}</td>
                    <td className="text-right py-0.5 whitespace-nowrap font-bold">{formatCurrency(item.line_total, sym)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Totals */}
            <div className="text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, sym)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount ({order.discount_percent}%)</span>
                  <span>-{formatCurrency(order.discount_amount, sym)}</span>
                </div>
              )}
              {order.parcel_charges > 0 && (
                <div className="flex justify-between">
                  <span>Parcel Charges</span>
                  <span>{formatCurrency(order.parcel_charges, sym)}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax_amount, sym)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                <span>TOTAL</span>
                <span>{formatCurrency(order.total, sym)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Footer */}
            <div className="text-center text-[10px] text-gray-500 italic">
              {store.receipt_footer || 'Thank you for your business!'}
            </div>
          </div>
        </div>

        {/* Bottom close action */}
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>Close Invoice</Button>
        </div>
      </div>
    </div>
  )
}
