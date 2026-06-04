// src/pages/reports/Reports.tsx
import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { useCategories } from '../../hooks/useCategories'
import { useProducts } from '../../hooks/useProducts'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/utils'
import { canViewReports } from '../../lib/permissions'
import EmptyState from '../../components/shared/EmptyState'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Loader2,
  AlertCircle,
  Award,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'

const chartColors = ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#99f6e4', '#ccfbf1']

export default function Reports() {
  const { activeStore, activeMember } = useAuthStore()
  const storeId = activeStore?.id
  const role = activeMember?.role || 'cashier'

  // Date presets
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | '7days' | 'month'>('7days')

  // Calculate start/end dates
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()

    switch (datePreset) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() - 1)
        end.setHours(23, 5, 59, 999)
        break
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case '7days':
      default:
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
    }

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    }
  }, [datePreset])

  // Role Protection check
  if (!canViewReports(role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto font-body">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-100">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 font-heading">Access Denied</h3>
        <p className="text-gray-500 text-sm mt-2">
          Only store owners and administrators can access consolidated financial reports and sales analytics charts.
        </p>
      </div>
    )
  }

  // Fetch product inventory to dictionary map for COGS calculations
  const { data: products = [] } = useProducts(storeId)
  const { data: categories = [] } = useCategories(storeId)

  const productCostMap = useMemo(() => {
    const map: Record<string, number> = {}
    products.forEach((p) => {
      map[p.id] = Number(p.cost_price || 0)
    })
    return map
  }, [products])

  const productCategoryMap = useMemo(() => {
    const map: Record<string, string> = {}
    products.forEach((p) => {
      if (p.category_id) {
        const cat = categories.find((c) => c.id === p.category_id)
        map[p.id] = cat ? cat.name : 'Unassigned'
      } else {
        map[p.id] = 'Unassigned'
      }
    })
    return map
  }, [products, categories])

  // Fetch all completed orders for reports range
  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['reports-orders', storeId, dateRange],
    queryFn: async () => {
      if (!storeId) return []
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('store_id', storeId)
        .eq('status', 'completed')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)

      if (error) throw error
      return data || []
    },
    enabled: !!storeId,
  })

  // Calculate Metrics & Chart Data points locally
  const metrics = useMemo(() => {
    let totalSales = 0
    let totalCOGS = 0
    const orderCount = orders.length

    // Payment methods map
    const paymentMethodsDict: Record<string, number> = {}
    // Categories map
    const categoriesDict: Record<string, number> = {}
    // Hourly map (0-23)
    const hourlySalesDict: Record<number, number> = Array.from({ length: 24 }, (_, i) => i).reduce(
      (acc, h) => ({ ...acc, [h]: 0 }),
      {} as Record<number, number>
    )
    // Products map
    const productsDict: Record<string, { name: string; qty: number; sales: number }> = {}

    orders.forEach((o) => {
      totalSales += Number(o.total)

      // Payment Method distribution
      const pm = o.payment_method || 'other'
      paymentMethodsDict[pm] = (paymentMethodsDict[pm] || 0) + Number(o.total)

      // Hourly trend
      const hr = new Date(o.created_at).getHours()
      hourlySalesDict[hr] = (hourlySalesDict[hr] || 0) + Number(o.total)

      // Process Items
      if (o.order_items) {
        o.order_items.forEach((item: any) => {
          const qty = Number(item.quantity)
          const lineVal = Number(item.line_total)

          // COGS
          const cost = productCostMap[item.product_id] || 0
          totalCOGS += cost * qty

          // Category distribution
          const catName = productCategoryMap[item.product_id] || 'Unassigned'
          categoriesDict[catName] = (categoriesDict[catName] || 0) + lineVal

          // Top selling items
          const pName = item.product_name
          if (!productsDict[pName]) {
            productsDict[pName] = { name: pName, qty: 0, sales: 0 }
          }
          productsDict[pName].qty += qty
          productsDict[pName].sales += lineVal
        })
      }
    })

    const grossProfit = totalSales - totalCOGS
    const avgOrderVal = orderCount > 0 ? totalSales / orderCount : 0

    // Format charts data
    const pieData = Object.entries(paymentMethodsDict).map(([name, value]) => ({
      name: name.toUpperCase(),
      value: Number(value.toFixed(2)),
    }))

    const barData = Object.entries(categoriesDict).map(([name, value]) => ({
      name,
      Sales: Number(value.toFixed(2)),
    }))

    const lineData = Object.entries(hourlySalesDict).map(([hour, val]) => ({
      Hour: `${hour}:00`,
      Sales: Number(val.toFixed(2)),
    }))

    const topProducts = Object.values(productsDict)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    return {
      totalSales: Number(totalSales.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      avgOrderVal: Number(avgOrderVal.toFixed(2)),
      orderCount,
      pieData,
      barData,
      lineData,
      topProducts,
    }
  }, [orders, productCostMap, productCategoryMap])

  const currencySymbol = activeStore?.currency_symbol || '₹'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f766e]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Date Toggle bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-heading">Reports & Analytics</h2>
          <p className="text-gray-500 font-body text-sm mt-0.5">Track financial performance, sales charts, and top items</p>
        </div>

        {/* Date Preset Selection */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-150 shrink-0 font-body text-xs font-semibold">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id as any)}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                datePreset === preset.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex items-center justify-center min-h-[400px]">
          <EmptyState
            icon={<BarChart3 className="w-8 h-8 text-gray-400" />}
            title="No Data for Selection"
            description="Select a wider date range or complete more checkout orders to populate report statistics."
          />
        </div>
      ) : (
        <>
          {/* Key Metrics Panels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
                  Total Sales
                </span>
                <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
                  {formatCurrency(metrics.totalSales, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Total Profit */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-[#0f766e]/5 rounded-2xl flex items-center justify-center text-[#0f766e] shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
                  Gross Profit
                </span>
                <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
                  {formatCurrency(metrics.grossProfit, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Avg Order value */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
                  Avg Order Val
                </span>
                <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
                  {formatCurrency(metrics.avgOrderVal, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide font-body">
                  Total Bills
                </span>
                <span className="font-bold text-gray-900 text-lg md:text-xl font-heading">
                  {metrics.orderCount}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly sales Trend */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 font-heading text-sm">Hourly Sales Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics.lineData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="Hour" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="Sales" stroke="#0f766e" strokeWidth={2.5} activeDot={{ r: 6 }} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 font-heading text-sm">Sales by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.barData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                    <Bar dataKey="Sales" fill="#0f766e" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Method Split */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 font-heading text-sm">Payment Methods</h3>
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-full h-48 sm:w-1/2 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {metrics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div className="flex flex-wrap sm:flex-col gap-3 font-body text-xs font-semibold text-gray-650 justify-center">
                  {metrics.pieData.map((d, index) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: chartColors[index % chartColors.length] }}
                      />
                      <span className="uppercase">{d.name}:</span>
                      <strong className="text-gray-900">{formatCurrency(d.value, currencySymbol)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top 5 Products List */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-gray-900 font-heading text-sm">Top 5 Selling Items</h3>
              </div>
              <div className="divide-y divide-gray-50 font-body text-xs">
                {metrics.topProducts.map((p, idx) => (
                  <div key={p.name} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-400 bg-gray-50 w-6 h-6 rounded-lg flex items-center justify-center border border-gray-100">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-gray-800 text-sm">{p.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-semibold text-gray-500">{p.qty} Units Sold</span>
                      <strong className="text-gray-900 text-xs">{formatCurrency(p.sales, currencySymbol)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
