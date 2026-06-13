import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Eye,
  RotateCcw,
  Ban,
  Calendar,
  Printer,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';

export default function OrdersLog() {
  const { user } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Order details states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Refund Modal state
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  // Void Modal state
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidLoading, setVoidLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/orders?status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      
      const res = await apiClient.get(url);
      setOrders(res.data);
    } catch (err) {
      toast.error('Error fetching orders log');
    } finally {
      setLoading(false);
    }
  };

  // Today's date string in YYYY-MM-DD format (max for both date pickers)
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, statusFilter]);

  const handleApplyDateFilter = (e) => {
    e.preventDefault();
    // Constraint: start must not be after end
    if (startDate && endDate && startDate > endDate) {
      toast.error('Start Date cannot be after End Date');
      return;
    }
    // Constraint: dates must not be in the future
    if (startDate && startDate > todayStr) {
      toast.error('Start Date cannot be in the future');
      return;
    }
    if (endDate && endDate > todayStr) {
      toast.error('End Date cannot be in the future');
      return;
    }
    fetchOrders();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    // Re-fetch immediately after clearing
    setTimeout(() => fetchOrders(), 0);
  };

  // Process Refund
  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundReason) return;

    setRefundLoading(true);
    try {
      const res = await apiClient.post(`/api/orders/${selectedOrder._id}/refund`, {
        reason: refundReason,
      });
      toast.success('Order refunded successfully');
      setIsRefundModalOpen(false);
      setIsDetailsOpen(false);
      setSelectedOrder(null);
      setRefundReason('');
      fetchOrders(); // reload list
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error refunding order');
    } finally {
      setRefundLoading(false);
    }
  };

  // Process Void
  const handleVoidSubmit = async (e) => {
    e.preventDefault();
    if (!voidReason) return;

    setVoidLoading(true);
    try {
      const res = await apiClient.put(`/api/orders/${selectedOrder._id}/void`, {
        reason: voidReason,
      });
      toast.success('Order voided successfully');
      setIsVoidModalOpen(false);
      setIsDetailsOpen(false);
      setSelectedOrder(null);
      setVoidReason('');
      fetchOrders(); // reload list
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error voiding order');
    } finally {
      setVoidLoading(false);
    }
  };

  // Data Columns for Orders table
  const columns = [
    {
      header: 'Order ID',
      key: '_id',
      render: (row) => (
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          {row._id.substring(row._id.length - 8).toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Cashier',
      key: 'cashier_id',
      render: (row) => <span>{row.cashier_id?.name || 'Unknown'}</span>,
    },
    {
      header: 'Customer',
      key: 'customer_id',
      render: (row) => (
        <span>{row.customer_id?.name || <span className="text-slate-400 italic">Walk-in</span>}</span>
      ),
    },
    {
      header: 'Date & Time',
      key: 'createdAt',
      render: (row) => <span>{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Total Paid',
      key: 'total',
      render: (row) => <span className="font-black">₹{row.total.toFixed(2)}</span>,
    },
    {
      header: 'Inspect',
      key: 'actions',
      render: (row) => (
        <Button
          variant="secondary"
          icon={Eye}
          onClick={() => {
            setSelectedOrder(row);
            setIsDetailsOpen(true);
          }}
          className="!h-8 !px-2.5 rounded-lg text-xs"
        >
          View
        </Button>
      ),
    },
  ];

  const canMutate = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title="Orders History Log">
      </PageHeader>

      {/* Filter and Search controls */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
        {/* Status filters */}
        <div className="space-y-2 w-full md:w-auto">
          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
            Filter by Status
          </label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {['all', 'completed', 'refunded', 'voided'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 h-9 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-650/10'
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-350 border border-slate-105 dark:border-slate-800'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <form onSubmit={handleApplyDateFilter} className="flex flex-wrap items-end gap-3 w-full md:w-auto">
          <FormField label="Start Date" className="w-full sm:w-40">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                max={endDate || todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  // Don't allow future dates
                  if (val > todayStr) return;
                  setStartDate(val);
                  // Auto-clear endDate if it's now before the new startDate
                  if (endDate && val > endDate) setEndDate('');
                }}
                className={`w-full h-10 pl-9 pr-3 rounded-xl border bg-transparent text-slate-900 dark:text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  startDate && endDate && startDate > endDate
                    ? 'border-rose-400 ring-1 ring-rose-300'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>
          </FormField>

          <FormField label="End Date" className="w-full sm:w-40">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                max={todayStr}
                onChange={(e) => {
                  const val = e.target.value;
                  // Don't allow future dates
                  if (val > todayStr) return;
                  // Don't allow end before start
                  if (startDate && val < startDate) {
                    toast.error('End Date cannot be before Start Date');
                    return;
                  }
                  setEndDate(val);
                }}
                className={`w-full h-10 pl-9 pr-3 rounded-xl border bg-transparent text-slate-900 dark:text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  startDate && endDate && endDate < startDate
                    ? 'border-rose-400 ring-1 ring-rose-300'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              />
            </div>
          </FormField>

          {/* Active filter summary badge */}
          {(startDate || endDate) && (
            <div className="flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 px-2.5 py-1.5 rounded-lg h-10 whitespace-nowrap">
              {startDate && endDate
                ? `${startDate} → ${endDate}`
                : startDate
                ? `From ${startDate}`
                : `Until ${endDate}`}
            </div>
          )}

          <div className="flex space-x-2 w-full sm:w-auto">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 sm:flex-none !h-10 rounded-xl text-xs font-bold"
              disabled={!!(startDate && endDate && startDate > endDate)}
            >
              Apply
            </Button>
            <Button
              variant="secondary"
              onClick={handleClearFilters}
              className="flex-1 sm:flex-none !h-10 rounded-xl text-xs"
            >
              Clear
            </Button>
          </div>
        </form>
      </div>

      {/* Orders List Table / Cards */}
      {isMobile ? (
        loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : orders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orders.map((order) => {
              const orderIdTail = order._id.substring(order._id.length - 8).toUpperCase();
              return (
                <div
                  key={order._id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        #{orderIdTail}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Customer</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                        {order.customer_id?.name || 'Walk-in'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Cashier</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                        {order.cashier_id?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Payments</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {order.payments?.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize"
                          >
                            {p.method}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Paid</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">
                        ₹{order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <Button
                      variant="secondary"
                      icon={Eye}
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailsOpen(true);
                      }}
                      className="w-full !h-9 text-xs rounded-xl font-bold"
                    >
                      View Receipt Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No transactions match the selected criteria</p>
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          isLoading={loading}
          idKey="_id"
          emptyState={
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No transactions match the selected criteria</p>
            </div>
          }
        />
      )}

      {/* Details View and Print Receipt Modal */}
      {isDetailsOpen && selectedOrder && (
        <Modal
          title={`Order Inspection #${selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}`}
          onClose={() => setIsDetailsOpen(false)}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Details breakdown */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Order Meta</h4>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-slate-700 dark:text-slate-350">
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-bold">{selectedOrder.cashier_id?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-bold">{selectedOrder.customer_id?.name || 'Walk-in'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date Completed:</span>
                    <span className="font-bold">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Current Status:</span>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  {selectedOrder.status === 'refunded' && (
                    <div className="border-t pt-2 mt-2 space-y-1">
                      <p className="font-black text-rose-500 text-[10px]">REFUND AUDIT:</p>
                      <p className="italic font-bold">Reason: {selectedOrder.refund_reason || 'Return'}</p>
                    </div>
                  )}
                  {selectedOrder.status === 'voided' && (
                    <div className="border-t pt-2 mt-2 space-y-1">
                      <p className="font-black text-rose-500 text-[10px]">VOID AUDIT:</p>
                      <p className="italic font-bold">Reason: {selectedOrder.void_reason || 'Void'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions details items */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sold Items</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        {item.variant_name && <p className="text-[10px] text-indigo-500">{item.variant_name}</p>}
                        <p className="text-slate-400 text-[10px] font-semibold">Qty: {item.quantity} x ₹{item.price.toFixed(2)}</p>
                      </div>
                      <span className="font-extrabold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role-gated management buttons */}
              {canMutate && selectedOrder.status === 'completed' && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={() => {
                      setRefundReason('');
                      setIsRefundModalOpen(true);
                    }}
                    className="flex-1 text-xs rounded-xl"
                  >
                    Refund Order
                  </Button>
                  <Button
                    variant="danger"
                    icon={Ban}
                    onClick={() => {
                      setVoidReason('');
                      setIsVoidModalOpen(true);
                    }}
                    className="flex-1 text-xs rounded-xl"
                  >
                    Void Order
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column: Receipt printout */}
            <div className="flex flex-col items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-start">Receipt Preview</h4>
              <div
                id="receipt-details-print-area"
                className="w-full p-4 bg-white text-slate-900 border rounded-2xl text-xs font-mono space-y-4 shadow-sm"
              >
                <div className="text-center">
                  <h3 className="text-sm font-extrabold">{user.outlet_id?.name}</h3>
                  {user.outlet_id?.address && <p className="text-[10px] mt-0.5">{user.outlet_id.address}</p>}
                  {user.outlet_id?.tax_number && <p className="text-[10px]">Tax: {user.outlet_id.tax_number}</p>}
                  <p className="text-[9px] text-slate-450 mt-1">Receipt: {selectedOrder._id.toUpperCase()}</p>
                  <p className="text-[9px] text-slate-450">Date: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>

                <div className="border-t border-dashed py-2 space-y-1">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.name} {item.variant_name ? `(${item.variant_name})` : ''} x{item.quantity}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>-₹{selectedOrder.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.taxes.map((t, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{t.name}:</span>
                      <span>₹{t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-black text-sm pt-1.5 border-t border-dashed">
                    <span>Total Paid:</span>
                    <span>₹{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-dashed pt-2 space-y-1">
                  <p className="font-bold text-[10px]">Payment breakdown:</p>
                  {selectedOrder.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{p.method}:</span>
                      <span>₹{p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4 border-t border-dashed text-[10px] text-slate-400">
                  <p>Thank you for shopping with us!</p>
                </div>
              </div>

              <Button
                variant="primary"
                icon={Printer}
                onClick={() => {
                  const w = window.open();
                  const content = document.getElementById('receipt-details-print-area').innerHTML;
                  w.document.write(`
                    <html>
                      <head><title>Print Receipt</title></head>
                      <body style="font-family: monospace; padding: 20px;" onload="window.print(); window.close();">
                        ${content}
                      </body>
                    </html>
                  `);
                  w.document.close();
                }}
                className="w-full mt-4 rounded-xl font-bold"
              >
                Print Receipt Copy
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <Modal
          title="Refund Transaction confirmation"
          onClose={() => setIsRefundModalOpen(false)}
          size="sm"
        >
          <form onSubmit={handleRefundSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to refund this order? Items will be restored to active inventory, and loyalty points deducted.
            </p>
            <FormField label="Refund Justification / Reason" required>
              <input
                type="text"
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Customer return, item damaged..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>

            <div className="flex space-x-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsRefundModalOpen(false)}
                disabled={refundLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={refundLoading}
                className="flex-1"
              >
                Confirm Refund
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Void Modal */}
      {isVoidModalOpen && (
        <Modal
          title="Void Transaction confirmation"
          onClose={() => setIsVoidModalOpen(false)}
          size="sm"
        >
          <form onSubmit={handleVoidSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to void this order? Items will be restored to active inventory. This cannot be undone.
            </p>
            <FormField label="Void Justification / Reason" required>
              <input
                type="text"
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Incorrect transaction entry, operator error..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>

            <div className="flex space-x-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsVoidModalOpen(false)}
                disabled={voidLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                loading={voidLoading}
                className="flex-1"
              >
                Confirm Void
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
