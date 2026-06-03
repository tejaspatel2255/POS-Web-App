// File Path: d:/Projects/Web/Universal POS/src/pages/dashboard/Dashboard.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, TrendingUp, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { getPendingOrderCount } from '@/lib/offlineDb'
import { formatCurrency } from '@/lib/formatCurrency'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import InvoiceModal from '@/components/pos/InvoiceModal'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabaseClient'
// types not needed at module level - ord is typed inline via useOrders hook

export default function Dashboard() {
  const navigate = useNavigate()
  const { activeStore } = useAuth()
  
  // Queries
  const { data: categories = [] } = useCategories(activeStore?.id)
  const { data: products = [] } = useProducts(activeStore?.id)
  
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const { data: orders = [], refetch, isLoading } = useOrders(activeStore?.id, {
    startDate: todayStart.toISOString(),
  })

  // Local state for statistics and pending local DB sync
  const [offlinePendingCount, setOfflinePendingCount] = useState(0)
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null)

  // Fetch offline queue counts
  const fetchOfflineCount = async () => {
    const count = await getPendingOrderCount()
    setOfflinePendingCount(count)
  }

  useEffect(() => {
    fetchOfflineCount()
    const interval = setInterval(fetchOfflineCount, 5000)
    return () => clearInterval(interval)
  }, [])

  // Real-time Supabase subscription on orders table
  useEffect(() => {
    if (!activeStore) return

    const channel = supabase
      .channel('dashboard-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${activeStore.id}`,
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeStore, refetch])

  if (!activeStore) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-semibold">
        No active store selected.
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={4} />
  }

  // Calculate statistics
  const completedOrders = orders.filter((o) => o.status === 'completed')
  const todaySales = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const todayOrdersCount = orders.length
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length
  const onHoldCount = orders.filter((o) => o.status === 'on_hold').length

  // Setup checklist statuses
  const hasCategories = categories.length > 0
  const hasProducts = products.length > 0
  const hasSale = orders.length > 0
  const isNewStore = !hasCategories || !hasProducts || !hasSale

  const sym = activeStore.currency_symbol

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      
      {/* Dashboard Top Header */}
      <PageHeader
        title="Dashboard Overview"
        subtitle={`Real-time operational summary for ${activeStore.name}`}
        action={
          <Button
            onClick={() => navigate('/billing')}
            className="hidden md:flex bg-primary hover:bg-primary/90 items-center gap-2 font-bold shadow-md min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4" />
            New Billing Order
          </Button>
        }
      />

      {/* Checklist Panel for Onboarding Setup */}
      {isNewStore && (
        <div className="p-4 sm:p-6 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold font-poppins">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-sm">Your Store Setup Checklist</h3>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Complete the remaining setup stages to get your workspace fully operational.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            
            {/* Checklist Item: Categories */}
            <div
              onClick={() => navigate('/menu')}
              className="p-4 bg-white border border-muted/50 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-muted/10 transition-colors min-h-[48px]"
            >
              {hasCategories ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-foreground font-poppins">Create Categories</p>
                <p className="text-[10px] text-muted-foreground">Group food menus</p>
              </div>
            </div>

            {/* Checklist Item: Products */}
            <div
              onClick={() => navigate('/menu')}
              className="p-4 bg-white border border-muted/50 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-muted/10 transition-colors min-h-[48px]"
            >
              {hasProducts ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-foreground font-poppins">Add Products</p>
                <p className="text-[10px] text-muted-foreground">Define items & prices</p>
              </div>
            </div>

            {/* Checklist Item: Sales */}
            <div
              onClick={() => navigate('/billing')}
              className="p-4 bg-white border border-muted/50 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-muted/10 transition-colors min-h-[48px]"
            >
              {hasSale ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold text-foreground font-poppins">Make First Sale</p>
                <p className="text-[10px] text-muted-foreground">Create order from POS</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Operations Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Today's revenue */}
        <div className="p-3 sm:p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-0.5 sm:space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase leading-none">Today's Sales</p>
          <p className="text-lg sm:text-xl font-extrabold text-primary font-poppins truncate">
            {formatCurrency(todaySales, sym)}
          </p>
        </div>

        {/* Today's total count */}
        <div className="p-3 sm:p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-0.5 sm:space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase leading-none">Total Orders</p>
          <p className="text-lg sm:text-xl font-extrabold text-foreground font-poppins">
            {todayOrdersCount}
          </p>
        </div>

        {/* Pending count */}
        <div className="p-3 sm:p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-0.5 sm:space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase leading-none">Pending Orders</p>
          <p className="text-lg sm:text-xl font-extrabold text-yellow-600 font-poppins">
            {pendingOrdersCount}
          </p>
        </div>

        {/* On hold count */}
        <div className="p-3 sm:p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-0.5 sm:space-y-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase leading-none">On Hold</p>
          <p className="text-lg sm:text-xl font-extrabold text-orange-600 font-poppins">
            {onHoldCount}
          </p>
        </div>

        {/* Offline unsynced count */}
        <div className="p-3 sm:p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-0.5 sm:space-y-1 relative overflow-hidden col-span-2 lg:col-span-1">
          <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase leading-none">Unsynced (Offline)</p>
          <p className={`text-lg sm:text-xl font-extrabold font-poppins ${offlinePendingCount > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
            {offlinePendingCount}
          </p>
          {offlinePendingCount > 0 && (
            <span className="absolute right-2 top-2 bg-destructive/10 text-destructive p-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

      </div>

      {/* Recent Orders List Table */}
      <div className="bg-white/40 border border-white/50 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-xs sm:text-sm font-bold font-poppins text-foreground">Recent Transactions Today</h3>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs font-semibold">
            No transactions recorded today yet.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block border border-muted/50 rounded-xl overflow-hidden bg-white/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="p-3 font-bold text-muted-foreground uppercase">Order No</th>
                    <th className="p-3 font-bold text-muted-foreground uppercase">Time</th>
                    <th className="p-3 font-bold text-muted-foreground uppercase">Type</th>
                    <th className="p-3 font-bold text-muted-foreground uppercase text-right">Items</th>
                    <th className="p-3 font-bold text-muted-foreground uppercase text-right">Total</th>
                    <th className="p-3 font-bold text-muted-foreground uppercase">Payment</th>
                    <th className="p-3 font-bold text-muted-foreground uppercase">Status</th>
                    <th className="p-3 font-bold text-muted-foreground uppercase text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((ord) => {
                    const statusColors: Record<string, string> = {
                      completed: 'bg-green-100 text-green-800 border-green-200',
                      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
                      cancelled: 'bg-red-100 text-red-800 border-red-200',
                    }
                    const timeStr = new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                    return (
                      <tr key={ord.id} className="border-b hover:bg-white/60 transition-colors">
                        <td className="p-3 font-bold text-foreground">
                          {ord.order_number || ord.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="p-3 text-muted-foreground">{timeStr}</td>
                        <td className="p-3 capitalize text-muted-foreground">{ord.order_type.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-right font-semibold">{ord.items?.length || 0}</td>
                        <td className="p-3 text-right font-extrabold text-primary">{formatCurrency(ord.total, sym)}</td>
                        <td className="p-3 capitalize font-semibold">{ord.payment_method}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold border text-[9px] uppercase ${statusColors[ord.status] || ''}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="h-8 text-[10px] min-h-[44px]"
                          >
                            View Receipt
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-3">
              {orders.slice(0, 10).map((ord) => {
                const statusColors: Record<string, string> = {
                  completed: 'bg-green-100 text-green-800 border-green-200',
                  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
                  cancelled: 'bg-red-100 text-red-800 border-red-200',
                }
                const timeStr = new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                return (
                  <div key={ord.id} className="p-4 bg-white border border-muted/30 rounded-xl shadow-sm flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs">
                        {ord.order_number || ord.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{timeStr}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-muted/10 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold">Total</span>
                        <span className="text-sm font-extrabold text-primary">{formatCurrency(ord.total, sym)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-semibold border text-[9px] uppercase ${statusColors[ord.status] || ''}`}>
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoiceOrder(ord)}
                          className="h-8 text-[11px] min-h-[44px]"
                        >
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating New Order button for Mobile Only */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-background/0 z-40">
        <Button
          onClick={() => navigate('/billing')}
          className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 font-bold shadow-lg min-h-[48px] text-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          New Billing Order
        </Button>
      </div>

      {/* Invoice modal overlay */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          isOpen={!!selectedInvoiceOrder}
          onClose={() => setSelectedInvoiceOrder(null)}
          order={selectedInvoiceOrder}
          store={activeStore}
        />
      )}
    </div>
  )
}
