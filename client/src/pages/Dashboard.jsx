import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  IndianRupee,
  Package,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMediaQuery } from '../hooks/useMediaQuery';
import apiClient from '../api/apiClient';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/reports/sales');
      setData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-slate-500">Loading dashboard data...</span>
      </div>
    );
  }

  const { metrics = {}, chartData = [], topProducts = [], orders = [] } = data || {};
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title="Overview Dashboard">
        <Button variant="secondary" icon={RefreshCw} onClick={fetchDashboardData}>
          Reload
        </Button>
      </PageHeader>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Sales Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
              ₹{(metrics.totalRevenue || 0).toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-xl">
            <IndianRupee className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Orders Count Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Orders Count</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
              {metrics.orderCount || 0}
            </h3>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-650 dark:text-amber-400 rounded-xl">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Avg Order Value Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Order Value</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
              ₹{(metrics.averageOrderValue || 0).toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 rounded-xl">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Gross Profit Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Profit</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
              ₹{(metrics.grossProfit || 0).toFixed(2)}
            </h3>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400 rounded-xl">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Card */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50">Sales Performance</h4>
            <span className="text-xs font-semibold text-slate-400">Past 30 Days</span>
          </div>
          <div style={{ height: isMobile ? 200 : 300 }} className="w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0F172A',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Line type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-semibold text-sm">
                No transaction sales history in this date window
              </div>
            )}
          </div>
        </div>

        {/* Top Products Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-50">Top Selling Products</h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{p.quantity} units sold</p>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                    ₹{p.revenue.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm font-semibold">
                No product sales recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-50">Recent Orders</h4>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
          >
            View all orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                <th className="pb-3">Order ID</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Cashier</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm text-slate-700 dark:text-slate-350">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                    <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">
                      {order._id.substring(order._id.length - 8).toUpperCase()}
                    </td>
                    <td className="py-3 font-semibold">{order.customer_id?.name || 'Walk-in Customer'}</td>
                    <td className="py-3 font-semibold">{order.cashier_id?.name}</td>
                    <td className="py-3 font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 font-extrabold text-right text-slate-900 dark:text-slate-100">
                      ₹{order.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-semibold">
                    No orders completed yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
