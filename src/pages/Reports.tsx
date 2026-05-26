import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const COLORS = ['#0f766e', '#f59e0b', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6']

export default function Reports() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week')

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      const start = new Date()
      if (dateRange === 'today') start.setHours(0, 0, 0, 0)
      if (dateRange === 'week') start.setDate(start.getDate() - 7)
      if (dateRange === 'month') start.setMonth(start.getMonth() - 1)

      const { data } = await supabase
        .from('orders')
        .select(`
          id, total, created_at, status, order_type,
          order_items (
            quantity, unit_price,
            products (name, category_id, categories(name))
          )
        `)
        .gte('created_at', start.toISOString())
        .eq('status', 'completed')
      
      return data || []
    }
  })

  const { salesData, categoryData, summary } = useMemo(() => {
    let rev = 0
    let count = orders.length
    
    // Group sales by day
    const byDay: Record<string, number> = {}
    // Group by category
    const byCat: Record<string, number> = {}
    // Group by item
    const byItem: Record<string, {name: string, qty: number, revenue: number}> = {}

    orders.forEach(order => {
      rev += order.total
      
      const date = new Date(order.created_at || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      byDay[date] = (byDay[date] || 0) + order.total

      order.order_items.forEach((item: any) => {
        const catName = item.products?.categories?.name || 'Uncategorized'
        const prodName = item.products?.name || 'Unknown Item'
        const lineTotal = item.quantity * item.unit_price

        byCat[catName] = (byCat[catName] || 0) + lineTotal
        
        if (!byItem[prodName]) {
          byItem[prodName] = { name: prodName, qty: 0, revenue: 0 }
        }
        byItem[prodName].qty += item.quantity
        byItem[prodName].revenue += lineTotal
      })
    })

    const salesChart = Object.keys(byDay).map(k => ({ date: k, sales: byDay[k] }))
    const catChart = Object.keys(byCat).map(k => ({ name: k, value: byCat[k] }))
    const topProdList = Object.values(byItem).sort((a, b) => b.qty - a.qty).slice(0, 10)

    return {
      salesData: salesChart,
      categoryData: catChart,
      summary: {
        revenue: rev,
        orders: count,
        avgValue: count > 0 ? rev / count : 0,
        popular: topProdList.length > 0 ? topProdList[0].name : '-'
      }
    }
  }, [orders])

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Business performance insights</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 shadow-sm border w-full sm:w-auto">
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${dateRange === range ? 'bg-primary text-white shadow' : 'hover:bg-gray-100 text-gray-600'}`}
              onClick={() => setDateRange(range)}
            >
              {range === 'week' ? 'Past 7 Days' : range === 'month' ? 'Past 30 Days' : range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="glass-card border-none shadow-md overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold font-poppins text-primary">{formatCurrency(summary.revenue)}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-md overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold font-poppins text-secondary">{summary.orders}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-md overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-bold font-poppins text-blue-500">{formatCurrency(summary.avgValue)}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-md overflow-hidden relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Most Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-poppins text-amber-600 line-clamp-1" title={summary.popular}>{summary.popular}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-md">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {categoryData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center text-xs">
                    <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
