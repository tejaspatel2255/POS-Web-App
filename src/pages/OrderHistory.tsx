import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function OrderHistory() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: orders = [], isLoading } = useQuery<any[]>({
    queryKey: ['order-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      return data || []
    }
  })

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-primary">Order History</h1>
          <p className="text-muted-foreground mt-1">View and manage past orders</p>
        </div>
      </div>

      <Card className="glass-card border-none shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input 
                placeholder="Search Order ID..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/50"
              />
            </div>
            <select 
              className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-white/50 px-3 py-2 text-sm ring-offset-background"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-xl border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead>Order No</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-primary/5 transition-colors">
                        <TableCell className="font-semibold text-primary">{order.id.split('-')[0].toUpperCase()}</TableCell>
                        <TableCell>
                          <div className="text-sm">{new Date(order.created_at || '').toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">{new Date(order.created_at || '').toLocaleTimeString()}</div>
                        </TableCell>
                        <TableCell className="capitalize">{order.order_type.replace('_', ' ')}</TableCell>
                        <TableCell className="capitalize">{order.payment_method || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                            ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'}`}
                          >
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(order.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
