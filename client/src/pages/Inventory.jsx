import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowUpDown,
  History,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import { useTranslation } from 'react-i18next';
import { exportToCSV } from '../utils/csvExport';

export default function Inventory() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('levels');
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustChange, setAdjustChange] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferProduct, setTransferProduct] = useState(null);
  const [transferQty, setTransferQty] = useState('');
  const [transferTargetOutlet, setTransferTargetOutlet] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'levels') {
        const [invRes, outRes, reasonsRes] = await Promise.all([
          apiClient.get('/api/inventory'),
          apiClient.get('/api/outlets'),
          apiClient.get('/api/stock-adjustment-reasons'),
        ]);
        setInventory(invRes.data);
        setOutlets(outRes.data);
        setReasons(reasonsRes.data);
      } else {
        const logsRes = await apiClient.get('/api/inventory/logs');
        setLogs(logsRes.data);
      }
    } catch (err) {
      toast.error('Error fetching inventory details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Adjust stock Submit
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProduct || !adjustChange || isNaN(adjustChange) || !adjustReason) {
      toast.error('All fields are required');
      return;
    }

    setAdjustLoading(true);
    try {
      await apiClient.post('/api/inventory/adjust', {
        product_id: adjustProduct._id,
        change: Number(adjustChange),
        reason: adjustReason,
      });
      toast.success('Stock adjusted successfully');
      setIsAdjustOpen(false);
      setAdjustChange('');
      setAdjustReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error adjusting stock');
    } finally {
      setAdjustLoading(false);
    }
  };

  // Transfer stock Submit
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferProduct || !transferQty || isNaN(transferQty) || !transferTargetOutlet) {
      toast.error('All fields are required');
      return;
    }

    setTransferLoading(true);
    try {
      await apiClient.post('/api/inventory/transfer', {
        product_id: transferProduct._id,
        from_outlet_id: transferProduct.outlet_id,
        to_outlet_id: transferTargetOutlet,
        quantity: Number(transferQty),
      });
      toast.success('Stock transfer registered successfully');
      setIsTransferOpen(false);
      setTransferQty('');
      setTransferTargetOutlet('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error transferring stock');
    } finally {
      setTransferLoading(false);
    }
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (activeTab === 'levels') {
      const dataToExport = inventory.map(item => ({
        [t('products.name')]: item.product?.name,
        [t('products.sku')]: item.product?.sku,
        [t('products.category')]: item.product?.category_id?.name || 'Uncategorized',
        [t('inventory.current_stock')]: item.quantity,
        [t('products.min_stock')]: item.product?.stock_threshold || 5,
        Valuation: (item.quantity * item.product?.base_price).toFixed(2),
        IsLowStock: item.isLowStock ? 'YES' : 'NO'
      }));
      exportToCSV(dataToExport, 'inventory_levels');
    } else {
      const dataToExport = logs.map(log => ({
        Product: log.product_id?.name || 'Deleted Product',
        SKU: log.product_id?.sku || '',
        StockShift: log.change,
        Reason: log.reason,
        Operator: log.user_id?.name || 'System Auto',
        Timestamp: new Date(log.timestamp).toLocaleString()
      }));
      exportToCSV(dataToExport, 'inventory_audit_logs');
    }
  };

  // Stock levels columns
  const levelColumns = [
    {
      header: t('products.name'),
      key: 'product.name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">{row.product?.name}</span>
          <p className="text-[10px] text-slate-400 font-semibold">{row.product?.sku}</p>
        </div>
      ),
    },
    {
      header: t('products.category'),
      key: 'product.category_id',
      render: (row) => (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: row.product?.category_id?.color || '#94A3B8' }}
        >
          {row.product?.category_id?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      header: t('inventory.current_stock'),
      key: 'quantity',
      render: (row) => (
        <span
          className={`font-black text-sm px-2.5 py-1 rounded-lg ${
            row.isLowStock
              ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30'
          }`}
        >
          {row.quantity} {row.isLowStock && '⚠️'}
        </span>
      ),
    },
    {
      header: t('products.min_stock'),
      key: 'product.stock_threshold',
      render: (row) => <span className="font-semibold text-xs">{row.product?.stock_threshold}</span>,
    },
    {
      header: 'Retail Valuation',
      key: 'valuation',
      render: (row) => (
        <span className="font-extrabold text-slate-800 dark:text-slate-200">
          ₹{(row.quantity * row.product?.base_price).toFixed(2)}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-1.5">
          <Button
            variant="secondary"
            onClick={() => {
              setAdjustProduct(row.product);
              setIsAdjustOpen(true);
            }}
            className="!h-8 !px-2.5 rounded-lg text-xs"
          >
            Adjust
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setTransferProduct(row.product);
              setIsTransferOpen(true);
            }}
            className="!h-8 !px-2.5 rounded-lg text-xs"
          >
            Transfer
          </Button>
        </div>
      ),
    },
  ];

  // Logs columns
  const logColumns = [
    {
      header: t('inventory.product'),
      key: 'product_id',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">{row.product_id?.name || 'Deleted Product'}</span>
          <p className="text-[10px] text-slate-400 font-semibold">{row.product_id?.sku}</p>
        </div>
      ),
    },
    {
      header: 'Stock Shift',
      key: 'change',
      render: (row) => (
        <span
          className={`font-black text-xs px-2 py-0.5 rounded ${
            row.change > 0
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450'
          }`}
        >
          {row.change > 0 ? `+${row.change}` : row.change}
        </span>
      ),
    },
    {
      header: t('inventory.reason'),
      key: 'reason',
      render: (row) => <span className="font-bold text-xs">{row.reason}</span>,
    },
    {
      header: 'Operator Staff',
      key: 'user_id',
      render: (row) => <span className="text-xs">{row.user_id?.name || 'System Auto'}</span>,
    },
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (row) => <span className="text-xs text-slate-400">{new Date(row.timestamp).toLocaleString()}</span>,
    },
  ];

  // Render Page
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title={t('inventory.title')}>
        <div className="flex space-x-2">
          <Button variant="secondary" icon={FileSpreadsheet} onClick={handleExportCSV}>
            {t('common.export_csv')}
          </Button>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>
            Reload
          </Button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-850">
        <button
          onClick={() => setActiveTab('levels')}
          className={`h-12 px-6 text-sm font-bold flex items-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'levels'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Boxes className="w-4 h-4 mr-2" /> {t('inventory.current_stock')}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`h-12 px-6 text-sm font-bold flex items-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <History className="w-4 h-4 mr-2" /> {t('inventory.logs')}
        </button>
      </div>

      {activeTab === 'levels' ? (
        <DataTable
          columns={levelColumns}
          data={inventory}
          isLoading={loading}
          idKey="product._id"
          emptyState={
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
              <Boxes className="w-10 h-10 text-slate-350 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Inventory levels are empty. Go to catalog to add stock.</p>
            </div>
          }
        />
      ) : (
        <DataTable
          columns={logColumns}
          data={logs}
          isLoading={loading}
          idKey="_id"
          emptyState={
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
              <History className="w-10 h-10 text-slate-350 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No stock adjustment entries in logs</p>
            </div>
          }
        />
      )}

      {/* Adjust Stock Modal */}
      {isAdjustOpen && adjustProduct && (
        <Modal
          title={`Adjust Inventory: ${adjustProduct.name}`}
          onClose={() => setIsAdjustOpen(false)}
          size="sm"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <FormField label="Quantity Change (+ or -)" required>
              <input
                type="number"
                required
                value={adjustChange}
                onChange={(e) => setAdjustChange(e.target.value)}
                placeholder="e.g. +10 or -3"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>

            <FormField label="Adjustment Reason" required>
              <select
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Reason</option>
                {reasons.map((r) => (
                  <option key={r._id} value={r.label}>
                    {r.label}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setIsAdjustOpen(false)} disabled={adjustLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={adjustLoading}>
                Save Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transfer Stock Modal */}
      {isTransferOpen && transferProduct && (
        <Modal
          title={`Inter-Branch Transfer: ${transferProduct.name}`}
          onClose={() => setIsTransferOpen(false)}
          size="sm"
        >
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <FormField label="Destination Outlet / Branch" required>
              <select
                required
                value={transferTargetOutlet}
                onChange={(e) => setTransferTargetOutlet(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Destination Branch</option>
                {outlets
                  .filter((o) => o._id !== transferProduct.outlet_id)
                  .map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Quantity to Transfer" required>
              <input
                type="number"
                min="1"
                required
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                placeholder="10"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
              />
            </FormField>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setIsTransferOpen(false)} disabled={transferLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={transferLoading}>
                Transfer Stock
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
