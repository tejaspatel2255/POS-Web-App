import { useOrders } from '@/hooks/useOrders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { IndianRupee, ShoppingBag, Clock, PackageOpen, Loader2 } from 'lucide-react'


export default function Dashboard() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: orders = [], isLoading } = useOrders({ 
    start: today.toISOString(), 
    end: new Date().toISOString() 
  })

  const stats = {
    revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    onHold: orders.filter(o => o.status === 'on_hold').length
  }

  const recentOrders = orders.slice(0, 5)

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of today's activities</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="glass-card border-none shadow-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
            <IndianRupee className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold font-poppins text-primary">{formatCurrency(stats.revenue)}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-secondary/10 rounded-full blur-2xl group-hover:bg-secondary/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold font-poppins text-secondary">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold font-poppins text-amber-500">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-none shadow-md overflow-hidden relative group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Hold</CardTitle>
            <PackageOpen className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl lg:text-3xl font-bold font-poppins text-blue-500">{stats.onHold}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none shadow-md">
        <CardHeader>
          <CardTitle className="font-poppins text-xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders today yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white">
                  <div>
                    <p className="font-semibold">{order.id.split('-')[0].toUpperCase()}</p>
                    <p className="text-sm text-muted-foreground capitalize">{order.order_type.replace('_', ' ')} • {order.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
                    <p className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full inline-block mt-1 uppercase tracking-wider",
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    )}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
