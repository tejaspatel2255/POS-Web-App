import { useRef } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { formatCurrency } from '@/lib/utils'
import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  cashierName: string
}

export default function InvoiceModal({ isOpen, onClose, orderId, cashierName }: InvoiceModalProps) {
  const { items, orderType, subtotal, totalDiscount, parcelCharges, total } = useCartStore()
  const invoiceRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!invoiceRef.current) return
    const content = invoiceRef.current.innerHTML
    const printWindow = window.open('', '', 'height=600,width=800')
    if (!printWindow) return
    
    printWindow.document.write('<html><head><title>Receipt</title>')
    printWindow.document.write('<style>')
    printWindow.document.write(`
      body { font-family: 'DM Sans', sans-serif; margin: 0; padding: 20px; font-size: 12px; width: 80mm; }
      .text-center { text-align: center; }
      .font-bold { font-weight: bold; }
      .text-xl { font-size: 1.25rem; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-4 { margin-bottom: 1rem; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .border-b { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
      .border-t { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; padding: 2px 0; }
      th { border-bottom: 1px solid #000; }
      .text-right { text-align: right; }
    `)
    printWindow.document.write('</style></head><body>')
    printWindow.document.write(content)
    printWindow.document.write('</body></html>')
    printWindow.document.close()
    
    // Wait for fonts to load
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold font-poppins text-primary">Receipt</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 bg-gray-50" ref={invoiceRef}>
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold font-poppins">SAVALIYA ICE CREAM</h1>
            <p className="text-sm">Main Bazaar, City</p>
            <p className="text-sm">Phone: +91 9876543210</p>
          </div>
          
          <div className="text-sm mb-4 border-b pb-2">
            <div className="flex justify-between">
              <span>Order No:</span>
              <span className="font-medium">{orderId.split('-')[0].toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{new Date().toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="capitalize">{orderType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{cashierName}</span>
            </div>
          </div>
          
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b">
                <th className="pb-1">Item</th>
                <th className="pb-1 text-center">Qty</th>
                <th className="pb-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.cart_item_id}>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">{(item.price! * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="text-sm border-t pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{subtotal().toFixed(2)}</span>
            </div>
            {totalDiscount() > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>-{totalDiscount().toFixed(2)}</span>
              </div>
            )}
            {parcelCharges > 0 && (
              <div className="flex justify-between">
                <span>Parcel Charges</span>
                <span>{parcelCharges.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t mt-2 pt-2">
              <span>TOTAL</span>
              <span>{formatCurrency(total())}</span>
            </div>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Thank you for visiting!</p>
            <p>Have a sweet day 🍦</p>
          </div>
        </div>
        
        <div className="p-4 border-t bg-white flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>
        </div>
      </div>
    </div>
  )
}
