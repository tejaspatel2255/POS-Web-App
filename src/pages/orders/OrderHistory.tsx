// src/pages/orders/OrderHistory.tsx
import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useOrders } from '../../hooks/useOrders'
import { formatCurrency } from '../../lib/utils'
import InvoiceModal from '../../components/pos/InvoiceModal'
import EmptyState from '../../components/shared/EmptyState'
import { History, Download, Calendar, Filter, Loader2, ArrowRight, ClipboardList } from 'lucide-react'

const orderTypes = ['walk_in', 'dine_in', 'takeaway', 'parcel', 'delivery']
const paymentMethods = ['cash', 'card', 'upi', 'other']

export default function OrderHistory() {
  const { activeStore } = useAuthStore()
  const storeId = activeStore?.id

  // Date ranges
  const getSevenDaysAgo = () => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  }
  const getToday = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Filter States
  const [status, setStatus] = useState<string>('all')
  const [paymentMethod, setPaymentMethod] = useState<string>('all')
  const [orderType, setOrderType] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>(getSevenDaysAgo())
  const [dateTo, setDateTo] = useState<string>(getToday())

  // Selected Order for Invoice view
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  // Construct filters payload for hook
  const filters = {
    status: status === 'all' ? undefined : status,
    paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod,
    orderType: orderType === 'all' ? undefined : orderType,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59.999Z').toISOString() : undefined,
  }

  const { data: orders = [], isLoading, refetch } = useOrders(storeId, filters)

  // Re-fetch when connection states change
  useEffect(() => {
    window.addEventListener('orders-synced', () => refetch())
    return () => window.removeEventListener('orders-synced', () => refetch())
  }, [refetch])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'on_hold':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-red-50 text-red-700 border-red-200'
    }
  }

  const exportToCSV = () => {
    if (orders.length === 0) return

    const headers = [
      'Order No,Date,Cashier,Type,Payment,Subtotal,Discount %,Discount Amt,Parcel,Tax,Total,Status\n',
    ]
    const rows = orders.map((o) => {
      const dateStr = new Date(o.created_at).toLocaleString().replace(/,/g, '')
      return `${o.order_number},${dateStr},"${o.cashier_name}",${o.order_type},${o.payment_method},${o.subtotal},${o.discount_percent},${o.discount_amount},${o.parcel_charges},${o.tax_amount},${o.total},${o.status}`
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orders_${activeStore?.name || 'store'}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const currencySymbol = activeStore?.currency_symbol || '₹'

  return (
    <div className="space-y-6">
      {/* Header and Export Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Order History</h2>
          <p className="text-gray-500 font-body text-sm mt-0.5">Filter, review, and print receipts for all store bills</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={orders.length === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0f766e] hover:bg-[#0d635c] text-white rounded-xl font-bold font-body text-xs shadow-md shadow-[#0f766e]/10 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Tabs and Filters Pane */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100">
          {['all', 'completed', 'pending', 'on_hold', 'cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-body uppercase tracking-wider whitespace-nowrap transition-colors ${
                status === st
                  ? 'bg-[#0f766e] text-white'
                  : 'bg-gray-50 text-gray-400 hover:text-gray-700'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Date Filters Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold font-body text-gray-500">
          <div>
            <label className="block text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-colors outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-colors outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-colors outline-none text-gray-950 font-semibold"
            >
              <option value="all">All Types</option>
              {orderTypes.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase().replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white transition-colors outline-none text-gray-950 font-semibold"
            >
              <option value="all">All Methods</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loader */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex items-center justify-center min-h-[300px]">
          <EmptyState
            icon={<ClipboardList className="w-8 h-8 text-gray-400" />}
            title="No Orders Found"
            description="Adjust your filters or generate new sales receipts to populate history."
          />
        </div>
      ) : (
        <>
          {/* Mobile Card list */}
          <div className="grid grid-cols-1 md:hidden gap-4">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col text-left justify-between hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div className="flex justify-between items-start w-full">
                  <div>
                    <h4 className="font-bold text-gray-900 font-heading text-sm">#{o.order_number}</h4>
                    <span className="text-[10px] text-gray-400 font-body block mt-0.5">
                      {new Date(o.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider font-body ${getStatusBadge(
                      o.status
                    )}`}
                  >
                    {o.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center w-full mt-4 pt-3 border-t border-gray-50 text-xs font-semibold font-body text-gray-500">
                  <div className="space-y-0.5">
                    <div>Cashier: <strong className="text-gray-700">{o.cashier_name || 'Staff'}</strong></div>
                    <div>Pay: <strong className="text-gray-700 uppercase">{o.payment_method}</strong></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(o.total, currencySymbol)}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-body">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] uppercase font-bold tracking-wider text-gray-400 font-body bg-gray-50/50">
                    <th className="p-4 w-20">Order No</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Cashier</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-center">Payment</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Subtotal</th>
                    <th className="p-4 text-right">Total</th>
                    <th className="p-4 text-center w-16">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className="hover:bg-gray-50/40 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-bold text-gray-900">#{o.order_number}</td>
                      <td className="p-4 text-gray-400">{new Date(o.created_at).toLocaleString()}</td>
                      <td className="p-4 font-semibold text-gray-800">{o.cashier_name || 'Staff'}</td>
                      <td className="p-4 text-center uppercase font-semibold tracking-wider text-[10px]">
                        {o.order_type.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-center uppercase font-semibold text-[10px]">
                        {o.payment_method}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${getStatusBadge(
                            o.status
                          )}`}
                        >
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-gray-500">
                        {formatCurrency(o.subtotal, currencySymbol)}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-900">
                        {formatCurrency(o.total, currencySymbol)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[#0f766e] hover:underline font-bold inline-flex items-center gap-0.5">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Invoice receipt overlay modal */}
      {selectedOrder && (
        <InvoiceModal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          order={{
            ...selectedOrder,
            items: selectedOrder.order_items || [],
          }}
          store={activeStore}
        />
      )}
    </div>
  )
}
