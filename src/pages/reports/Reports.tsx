// File Path: d:/Projects/Web/Universal POS/src/pages/reports/Reports.tsx

import { useState, useMemo } from 'react'
import { DollarSign, ShoppingBag, ShoppingCart, Award } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { formatCurrency } from '@/lib/formatCurrency'
import PageHeader from '@/components/shared/PageHeader'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton'
import { Input } from '@/components/ui/input'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef']

export default function Reports() {
  const { activeStore } = useAuth()
  
  // Fetch products and categories to map product_id to category name
  const { data: products = [] } = useProducts(activeStore?.id)
  const { data: categories = [] } = useCategories(activeStore?.id)

  const productCategoryMap = useMemo(() => {
    const map: Record<string, string> = {}
    products.forEach((p) => {
      const cat = categories.find((c) => c.id === p.category_id)
      map[p.id] = cat ? cat.name : 'Unassigned'
    })
    return map
  }, [products, categories])

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('week')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Calculate dates based on option selected
  const queryDates = useMemo(() => {
    const start = new Date()
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    if (dateFilter === 'today') {
      start.setHours(0, 0, 0, 0)
    } else if (dateFilter === 'week') {
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
    } else if (dateFilter === 'month') {
      start.setDate(start.getDate() - 30)
      start.setHours(0, 0, 0, 0)
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      const customS = new Date(customStart)
      customS.setHours(0, 0, 0, 0)
      const customE = new Date(customEnd)
      customE.setHours(23, 59, 59, 999)
      return { start: customS.toISOString(), end: customE.toISOString() }
    }

    return { start: start.toISOString(), end: end.toISOString() }
  }, [dateFilter, customStart, customEnd])

  const { data: orders = [], isLoading } = useOrders(activeStore?.id, {
    startDate: queryDates.start,
    endDate: queryDates.end,
    status: 'completed', // only count completed sales in reports
  })

  // Statistics & charts calculations
  const stats = useMemo(() => {
    if (orders.length === 0) {
      return {
        revenue: 0,
        ordersCount: 0,
        avgOrder: 0,
        bestProduct: 'None',
        dailyData: [],
        categoryData: [],
        topProducts: [],
      }
    }

    let totalRevenue = 0
    const prodCounts: Record<string, { qty: number; revenue: number }> = {}
    const catRevenue: Record<string, number> = {}
    const dateRevenue: Record<string, number> = {}

    orders.forEach((o) => {
      totalRevenue += o.total
      
      // Daily revenue grouping
      const dateStr = new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
      dateRevenue[dateStr] = (dateRevenue[dateStr] || 0) + o.total

      // Itemized sales analysis
      o.items?.forEach((item) => {
        // Product stats
        const prodName = item.product_name
        if (!prodCounts[prodName]) {
          prodCounts[prodName] = { qty: 0, revenue: 0 }
        }
        prodCounts[prodName].qty += item.quantity
        prodCounts[prodName].revenue += item.line_total

        // Category stats (look up category from catalog if available)
        const catName = item.product_id ? (productCategoryMap[item.product_id] || 'Unassigned') : 'Unassigned'
        catRevenue[catName] = (catRevenue[catName] || 0) + item.line_total
      })
    })

    // Process daily chart data
    const dailyData = Object.entries(dateRevenue).map(([date, sales]) => ({
      date,
      sales: parseFloat(sales.toFixed(2)),
    })).reverse() // sort chronological

    // Process category pie chart data
    const categoryData = Object.entries(catRevenue).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }))

    // Process top products list
    const topProducts = Object.entries(prodCounts)
      .map(([name, data]) => ({
        name,
        qty: data.qty,
        revenue: parseFloat(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const bestProduct = topProducts.length > 0 ? topProducts[0].name : 'None'

    return {
      revenue: totalRevenue,
      ordersCount: orders.length,
      avgOrder: totalRevenue / orders.length,
      bestProduct,
      dailyData,
      categoryData,
      topProducts: topProducts.slice(0, 10),
    }
  }, [orders, productCategoryMap])

  if (!activeStore) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-semibold">
        No active store selected.
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={5} />
  }

  const sym = activeStore.currency_symbol

  return (
    <div className="space-y-6 pb-20">
      
      {/* Page Header */}
      <PageHeader
        title="Business Reports"
        subtitle={`Sales & analytics summary for ${activeStore.name}`}
      />

      {/* Date Filtering Bar */}
      <div className="bg-white/40 border border-white/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {(['today', 'week', 'month', 'custom'] as const).map((opt) => {
            const isSel = dateFilter === opt
            return (
              <button
                key={opt}
                onClick={() => setDateFilter(opt)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold font-poppins border transition-all ${
                  isSel
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white hover:bg-muted text-muted-foreground'
                }`}
              >
                {opt.toUpperCase()}
              </button>
            )
          })}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200">
            <Input
              type="date"
              className="h-8 text-xs bg-white"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-8 text-xs bg-white"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] font-bold uppercase block leading-none">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-extrabold text-primary font-poppins">
            {formatCurrency(stats.revenue, sym)}
          </p>
        </div>

        {/* Total completed orders count */}
        <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] font-bold uppercase block leading-none">Completed Sales</span>
            <ShoppingBag className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-extrabold text-foreground font-poppins">
            {stats.ordersCount}
          </p>
        </div>

        {/* Average Order Value */}
        <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] font-bold uppercase block leading-none">Avg Order Value</span>
            <ShoppingCart className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-extrabold text-foreground font-poppins">
            {formatCurrency(stats.avgOrder, sym)}
          </p>
        </div>

        {/* Best selling item */}
        <div className="p-4 bg-white/40 border border-white/50 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] font-bold uppercase block leading-none">Best Selling Item</span>
            <Award className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-sm font-extrabold text-foreground font-poppins truncate" title={stats.bestProduct}>
            {stats.bestProduct}
          </p>
        </div>
      </div>

      {/* Chart Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Revenue over Time bar chart */}
        <div className="bg-white/40 border border-white/50 rounded-2xl p-4 shadow-sm md:col-span-2 space-y-3">
          <h3 className="text-xs font-bold font-poppins text-foreground uppercase tracking-wide">Daily Revenue History</h3>
          <div className="h-64">
            {stats.dailyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No sales recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(value) => formatCurrency(value as number, sym)} />
                  <Bar dataKey="sales" fill={activeStore.theme_color || '#0f766e'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories share pie chart */}
        <div className="bg-white/40 border border-white/50 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold font-poppins text-foreground uppercase tracking-wide">Sales By Category</h3>
          <div className="h-64 relative flex items-center justify-center">
            {stats.categoryData.length === 0 ? (
              <div className="text-xs text-muted-foreground">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.categoryData.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number, sym)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Top Products Table */}
      <div className="bg-white/40 border border-white/50 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold font-poppins text-foreground uppercase tracking-wide">Top 10 Products by Revenue</h3>
        {stats.topProducts.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">No item sales recorded.</div>
        ) : (
          <div className="border border-muted/50 rounded-xl overflow-hidden bg-white/40">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="p-3 font-bold text-muted-foreground uppercase w-12 text-center">Rank</th>
                  <th className="p-3 font-bold text-muted-foreground uppercase">Item Name</th>
                  <th className="p-3 font-bold text-muted-foreground uppercase text-right">Quantity Sold</th>
                  <th className="p-3 font-bold text-muted-foreground uppercase text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p, idx) => (
                  <tr key={p.name} className="border-b hover:bg-white/60 transition-colors">
                    <td className="p-3 text-center font-bold text-muted-foreground">{idx + 1}</td>
                    <td className="p-3 font-bold text-foreground">{p.name}</td>
                    <td className="p-3 text-right font-semibold">{p.qty}</td>
                    <td className="p-3 text-right font-extrabold text-primary">{formatCurrency(p.revenue, sym)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
