import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Package,
  Calendar,
  Layers,
  PieChart,
  BarChart3,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date ranges for sales report
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sales') {
        let url = '/api/reports/sales';
        if (startDate || endDate) {
          url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const res = await apiClient.get(url);
        setSalesData(res.data);
      } else {
        const res = await apiClient.get('/api/reports/inventory');
        setInventoryData(res.data);
      }
    } catch (err) {
      toast.error('Error compiling reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab]);

  const handleDateFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handlePrintInventory = () => {
    const w = window.open();
    const itemsList = inventoryData?.items || [];
    let rowsHtml = '';
    itemsList.forEach((item) => {
      rowsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.sku}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.valuationRetail || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    w.document.write(`
      <html>
        <head><title>Inventory Valuation Report</title></head>
        <body style="font-family: sans-serif; padding: 30px;">
          <h2>Inventory Valuation Audit Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <hr />
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f5f5f5; text-align: left;">
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">Product Name</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">SKU</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: center;">Quantity</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Valuation (Retail)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Business Intelligence Reports">
        <Button variant="secondary" icon={RefreshCw} onClick={fetchReports}>
          Reload
        </Button>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-850 shrink-0">
        <button
          onClick={() => setActiveTab('sales')}
          className={`h-12 px-6 text-sm font-bold flex items-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2" /> Sales & Profit Analytics
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`h-12 px-6 text-sm font-bold flex items-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Layers className="w-4 h-4 mr-2" /> Inventory Valuation
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : activeTab === 'sales' && salesData ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Date Range Selector */}
          <form
            onSubmit={handleDateFilter}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-end gap-3"
          >
            <FormField label="Start Date" className="w-44">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
              />
            </FormField>
            <FormField label="End Date" className="w-44">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
              />
            </FormField>
            <Button type="submit" variant="primary" className="!h-10 text-xs rounded-xl">
              Filter Reports
            </Button>
          </form>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                  ₹{salesData.metrics.totalRevenue.toFixed(2)}
                </h3>
              </div>
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net profit</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                  ₹{salesData.metrics.grossProfit.toFixed(2)}
                </h3>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orders count</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                  {salesData.metrics.orderCount}
                </h3>
              </div>
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Order Size</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                  ₹{salesData.metrics.averageOrderValue.toFixed(2)}
                </h3>
              </div>
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                <PieChart className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Revenue Trend Line</h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Top Selling Products</h4>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData.topProducts} layout="vertical" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={10} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="quantity" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={15} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'inventory' && inventoryData ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Valuation Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products Types</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                  {inventoryData.metrics.totalItems}
                </h3>
              </div>
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock Warnings</p>
                <h3 className={`text-2xl font-black mt-1 ${inventoryData.metrics.lowStockCount > 0 ? 'text-rose-500' : 'text-slate-900 dark:text-slate-50'}`}>
                  {inventoryData.metrics.lowStockCount}
                </h3>
              </div>
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-650 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valuation (Cost price)</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                  ₹{inventoryData.metrics.totalValuationCost.toFixed(2)}
                </h3>
              </div>
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valuation (Retail price)</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                  ₹{inventoryData.metrics.totalValuationRetail.toFixed(2)}
                </h3>
              </div>
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Valuation detailed table summary */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Audited Valuation Catalog List</h4>
              <Button variant="secondary" icon={Printer} onClick={handlePrintInventory} className="!h-9 text-xs rounded-xl">
                Print Valuation Audit
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-405 font-bold uppercase border-b border-slate-100 dark:border-slate-850">
                    <th className="p-3">Product Name</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Cost Price</th>
                    <th className="p-3 text-right">Retail Price</th>
                    <th className="p-3 text-right">Retail Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-350">
                  {inventoryData.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/10">
                      <td className="p-3 font-bold">{item.name}</td>
                      <td className="p-3 font-medium">{item.sku}</td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">₹{(item.cost || 0).toFixed(2)}</td>
                      <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-slate-50">
                        ₹{item.valuationRetail.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-405">
          No records compiled
        </div>
      )}
    </div>
  );
}
