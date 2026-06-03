// File Path: d:/Projects/Web/Universal POS/src/pages/orders/OrderHistory.tsx

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Search, Download, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { getPendingOrders } from '@/lib/offlineDb'
import { formatCurrency } from '@/lib/formatCurrency'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import InvoiceModal from '@/components/pos/InvoiceModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// types not needed at module level - ord is typed inline via useOrders hook

export default function OrderHistory() {
  const { user, activeStore, activeMember } = useAuth()
  const role = activeMember?.role

  // Filters State
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all')
  const paymentMethodFilter = 'all'
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Local Offline State
  const [offlineOrders, setOfflineOrders] = useState<any[]>([])
  
  // Selected Order for Invoice Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null)

  // Fetch Supabase Orders
  const { data: onlineOrders = [], isLoading } = useOrders(activeStore?.id, {
    status: selectedStatusTab,
    orderType: orderTypeFilter,
    paymentMethod: paymentMethodFilter,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
  })

  // Load offline orders from IndexedDB
  const loadOfflineOrders = async () => {
    try {
      const data = await getPendingOrders()
      // Filter for active store
      const storeOffline = data.filter((o) => o.store_id === activeStore?.id)
      setOfflineOrders(storeOffline)
    } catch (err) {
      console.error('Failed to load offline pending orders:', err)
    }
  }

  useEffect(() => {
    loadOfflineOrders()
    const interval = setInterval(loadOfflineOrders, 5000)
    return () => clearInterval(interval)
  }, [activeStore])

  // Combine and sort orders
  const allOrdersCombined = useMemo(() => {
    // Add is_synced: false property to offline orders, online ones default to true
    const offlineMapped = offlineOrders.map((o) => ({
      ...o.order,
      items: o.items,
      id: o.localId,
      order_number: 'PENDING-SYNC',
      is_offline: true,
      created_at: o.created_at || o.order?.created_at,
    }))

    const onlineMapped = onlineOrders.map((o) => ({
      ...o,
      is_offline: false,
    }))

    // Concatenate
    const combined = [...offlineMapped, ...onlineMapped]

    // Sort by created_at descending
    return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [onlineOrders, offlineOrders])

  // Client-side search and cashier RLS reinforcement
  const filteredOrders = useMemo(() => {
    return allOrdersCombined.filter((o) => {
      // 1. Search Query Match (Order number, customer name)
      const matchesSearch =
        searchQuery === '' ||
        (o.order_number && o.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.id && o.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))

      // 2. Cashier visibility restriction (Cashiers can only see their own orders)
      const matchesCashierRestriction =
        role !== 'cashier' || o.cashier_id === user?.id

      // 3. Status Tab filter fallback (useful for offline orders filtering)
      const matchesStatusTab =
        selectedStatusTab === 'all' || o.status === selectedStatusTab

      return matchesSearch && matchesCashierRestriction && matchesStatusTab
    })
  }, [allOrdersCombined, searchQuery, role, user, selectedStatusTab])

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return

    const headers = ['Order Number', 'Date & Time', 'Order Type', 'Payment Method', 'Subtotal', 'Tax', 'Parcel Charges', 'Total', 'Status', 'Sync Status']
    const rows = filteredOrders.map((o) => [
      o.order_number || o.id.slice(0, 8).toUpperCase(),
      new Date(o.created_at).toLocaleString(),
      o.order_type,
      o.payment_method,
      o.subtotal,
      o.tax_amount,
      o.parcel_charges,
      o.total,
      o.status,
      o.is_offline ? 'Unsynced' : 'Synced',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n')
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${activeStore?.name.replace(/\s+/g, '_')}_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!activeStore) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-semibold">
        No active store.
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Page Header */}
      <PageHeader
        title="Order Transaction History"
        subtitle={`Audit and manage invoices for ${activeStore.name}`}
        action={
          <Button
            onClick={handleExportCSV}
            disabled={filteredOrders.length === 0}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2 text-xs h-9 font-bold"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      {/* Filters Form Control */}
      <div className="bg-white/40 border border-white/50 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        {/* Date Range selectors */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">Start Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              type="date"
              className="pl-9 h-10 bg-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">End Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              type="date"
              className="pl-9 h-10 bg-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Order Type Selector */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">Order Type</label>
          <select
            className="w-full h-10 px-3 rounded-lg border border-input bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="walk_in">Walk In</option>
            <option value="dine_in">Dine In</option>
            <option value="takeaway">Takeaway</option>
            <option value="parcel">Parcel</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {/* Search Input bar */}
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-muted-foreground block leading-none">Search Invoices</label>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search by Order No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar for Order States */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-muted/50 scrollbar-none">
        {['all', 'completed', 'pending', 'on_hold', 'cancelled'].map((tab) => {
          const isSelected = selectedStatusTab === tab
          return (
            <button
              key={tab}
              onClick={() => setSelectedStatusTab(tab)}
              className={`px-4 py-2 border-b-2 font-poppins text-xs font-semibold uppercase tracking-wider transition-all ${
                isSelected
                  ? 'border-primary text-primary font-bold bg-primary/5 rounded-t-lg'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          )
        })}
      </div>

      {/* Orders Table list */}
      {isLoading ? (
        <LoadingSkeleton variant="table" count={5} />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white/40 border border-white/50 rounded-2xl">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">No matching invoices found.</p>
        </div>
      ) : (
        <div className="border border-white/50 bg-white/40 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-4 font-bold text-muted-foreground uppercase w-12 text-center">Sync</th>
                <th className="p-4 font-bold text-muted-foreground uppercase">Order No</th>
                <th className="p-4 font-bold text-muted-foreground uppercase">Date & Time</th>
                <th className="p-4 font-bold text-muted-foreground uppercase">Type</th>
                <th className="p-4 font-bold text-muted-foreground uppercase text-right">Items</th>
                <th className="p-4 font-bold text-muted-foreground uppercase text-right">Total</th>
                <th className="p-4 font-bold text-muted-foreground uppercase">Payment</th>
                <th className="p-4 font-bold text-muted-foreground uppercase">Status</th>
                <th className="p-4 font-bold text-muted-foreground uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => {
                const isOffline = ord.is_offline
                const statusColors: Record<string, string> = {
                  completed: 'bg-green-50 text-green-700 border-green-200',
                  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                  on_hold: 'bg-orange-50 text-orange-700 border-orange-200',
                  cancelled: 'bg-red-50 text-red-700 border-red-200',
                }

                return (
                  <tr key={ord.id} className="border-b hover:bg-white/60 transition-colors">
                    <td className="p-4 text-center">
                      {isOffline ? (
                        <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" title="Offline Queue Unsynced" />
                      ) : (
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="Synced Online" />
                      )}
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      {ord.order_number || ord.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(ord.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 capitalize text-muted-foreground">
                      {ord.order_type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-4 text-right font-semibold">{ord.items?.length || 0}</td>
                    <td className="p-4 text-right font-extrabold text-primary">
                      {formatCurrency(ord.total, activeStore.currency_symbol)}
                    </td>
                    <td className="p-4 capitalize font-semibold">{ord.payment_method}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold border text-[9px] uppercase ${statusColors[ord.status] || ''}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInvoice(ord)}
                        className="h-7 text-[10px] font-bold"
                      >
                        Print Receipt
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Modal for details and receipts */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          order={selectedInvoice}
          store={activeStore}
        />
      )}
    </div>
  )
}
