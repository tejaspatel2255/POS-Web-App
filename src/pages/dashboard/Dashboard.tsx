// src/pages/dashboard/Dashboard.tsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { useDashboardStats } from '../../hooks/useOrders'
import { useCategories } from '../../hooks/useCategories'
import { useProducts } from '../../hooks/useProducts'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Pause,
  Plus,
  CheckCircle2,
  Circle,
  ArrowRight,
  Loader2,
  Calendar,
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeStore } = useAuthStore()
  const storeId = activeStore?.id

  // Statistics & checklists queries
  const { data: stats, isLoading: statsLoading } = useDashboardStats(storeId)
  const { data: categories = [] } = useCategories(storeId)
  const { data: products = [] } = useProducts(storeId)

  // Fetch recent 10 orders
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ['recent-orders', storeId],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Real-time Postgres changes channel subscription
  useEffect(() => {
    if (!storeId) return

    const channel = supabase
      .channel('live-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', storeId] })
          queryClient.invalidateQueries({ queryKey: ['recent-orders', storeId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, queryClient])

  // Checklist values
  const hasCategories = categories.length > 0
  const hasProducts = products.length > 0
  const hasFirstOrder = recentOrders.length > 0
  const completedStepsCount = [hasCategories, hasProducts, hasFirstOrder].filter(Boolean).length

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

  const currencySymbol = activeStore?.currency_symbol || '₹'

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-[#0f766e]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">
            Welcome to {activeStore?.name || 'Your Store'}
          </h2>
          <p className="text-gray-500 font-body text-sm mt-0.5">
            Here's what is happening with your store today.
          </p>
        </div>
        <button
          onClick={() => navigate('/billing')}
          className="flex items-center gap-2 py-3 px-5 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all text-sm font-body"
          style={{
            backgroundColor: activeStore?.theme_color || '#0f766e',
            boxShadow: `0 10px 15px -3px ${activeStore?.theme_color}20`,
          }}
        >
          <Plus className="w-5 h-5" /> New Billing Order
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
              Today's Sales
            </span>
            <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
              {formatCurrency(stats?.todaySales || 0, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Order Count */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
              Total Orders
            </span>
            <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
              {stats?.orderCount || 0}
            </span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
              Pending Bills
            </span>
            <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
              {stats?.pendingCount || 0}
            </span>
          </div>
        </div>

        {/* On Hold Bills */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Pause className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
              On Hold
            </span>
            <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
              {stats?.onHoldCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Checklist & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup checklist (Left panel) */}
        {completedStepsCount < 3 && (
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 font-heading text-lg">Setup Checklist</h3>
              <span className="text-[10px] font-bold bg-[#0f766e]/10 text-[#0f766e] px-2.5 py-1 rounded-full uppercase tracking-wider font-body">
                {completedStepsCount}/3 Steps
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0f766e] h-2 transition-all duration-300"
                style={{ width: `${(completedStepsCount / 3) * 100}%` }}
              />
            </div>

            <div className="divide-y divide-gray-50 text-sm font-body">
              {/* Step 1 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasCategories ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                  )}
                  <span className={hasCategories ? 'line-through text-gray-400' : 'text-gray-700'}>
                    Create product categories
                  </span>
                </div>
                {!hasCategories && (
                  <button
                    onClick={() => navigate('/menu')}
                    className="text-xs font-semibold text-[#0f766e] hover:underline flex items-center gap-0.5"
                  >
                    Go <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Step 2 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasProducts ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                  )}
                  <span className={hasProducts ? 'line-through text-gray-400' : 'text-gray-700'}>
                    Add items to your inventory
                  </span>
                </div>
                {!hasProducts && (
                  <button
                    onClick={() => navigate('/menu')}
                    className="text-xs font-semibold text-[#0f766e] hover:underline flex items-center gap-0.5"
                  >
                    Go <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Step 3 */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasFirstOrder ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                  )}
                  <span className={hasFirstOrder ? 'line-through text-gray-400' : 'text-gray-700'}>
                    Place your first billing order
                  </span>
                </div>
                {!hasFirstOrder && (
                  <button
                    onClick={() => navigate('/billing')}
                    className="text-xs font-semibold text-[#0f766e] hover:underline flex items-center gap-0.5"
                  >
                    Go <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent 10 orders list (Right panel) */}
        <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 ${
          completedStepsCount < 3 ? 'lg:col-span-2' : 'lg:col-span-3'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 font-heading text-lg">Recent Bills</h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-semibold text-[#0f766e] hover:underline flex items-center gap-0.5 font-body"
            >
              View History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-body text-sm">
              No orders registered yet. Start by generating bills in the billing screen.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-body">
                <thead>
                  <tr className="border-b border-gray-100 text-[9px] uppercase font-bold tracking-wider text-gray-400 py-2">
                    <th className="pb-2">Order No</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Cashier</th>
                    <th className="pb-2 text-center">Type</th>
                    <th className="pb-2 text-center">Status</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="py-3 font-bold text-gray-900">#{o.order_number}</td>
                      <td className="py-3 text-gray-400">
                        {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 font-semibold">{o.cashier_name || 'Staff'}</td>
                      <td className="py-3 text-center uppercase tracking-wide font-semibold text-[10px]">
                        {o.order_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(o.status)}`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900">
                        {formatCurrency(o.total, currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
