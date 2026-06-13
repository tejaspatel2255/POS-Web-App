import React, { useState, useEffect } from 'react';
import {
  Building,
  Store,
  Users,
  Percent,
  Coins,
  Ticket,
  Printer,
  History,
  Plus,
  Edit,
  Trash2,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useShiftStore } from '../store/useShiftStore';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';

export default function Settings() {
  const { user } = useAuthStore();
  const { allShifts, fetchShiftsLog } = useShiftStore();

  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Settings states
  const [outlet, setOutlet] = useState(null);
  const [loyaltyEarn, setLoyaltyEarn] = useState('1');
  const [loyaltyRedeem, setLoyaltyRedeem] = useState('0.01');
  const [requireShift, setRequireShift] = useState(false);

  // Lists states
  const [outlets, setOutlets] = useState([]);
  const [users, setUsers] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [discountTypes, setDiscountTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Modals / Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'outlet', 'user', 'tax', 'discount', 'payment'
  const [editingItem, setEditingItem] = useState(null);

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formField1, setFormField1] = useState(''); // address (outlet), email (user), rate (tax), value (discount), type (payment)
  const [formField2, setFormField2] = useState(''); // tax_number (outlet), role (user)
  const [formField3, setFormField3] = useState(''); // footerText (outlet), isEnabled (payment)

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      if (activeSection === 'profile') {
        const res = await apiClient.get('/api/settings');
        setOutlet(res.data.outlet);
        setLoyaltyEarn(String(res.data.settings.loyalty_earn_rate || '1'));
        setLoyaltyRedeem(String(res.data.settings.loyalty_redeem_rate || '0.01'));
        setRequireShift(res.data.settings.require_shift_open === 'true' || res.data.settings.require_shift_open === true);
      } else if (activeSection === 'outlets' && user.role === 'admin') {
        const res = await apiClient.get('/api/outlets');
        setOutlets(res.data);
      } else if (activeSection === 'users' && user.role === 'admin') {
        const res = await apiClient.get('/api/users');
        setUsers(res.data);
      } else if (activeSection === 'taxes') {
        const res = await apiClient.get('/api/tax-rates');
        setTaxRates(res.data);
      } else if (activeSection === 'discounts') {
        const res = await apiClient.get('/api/discount-types');
        setDiscountTypes(res.data);
      } else if (activeSection === 'payments') {
        const res = await apiClient.get('/api/payment-methods');
        setPaymentMethods(res.data);
      } else if (activeSection === 'shifts') {
        await fetchShiftsLog();
      }
    } catch (err) {
      toast.error('Error loading settings configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSettingsData();
    }
  }, [user, activeSection]);

  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  // Save profile settings
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      // 1. Update outlet business profile
      await apiClient.put('/api/settings/profile', {
        name: outlet.name,
        address: outlet.address,
        tax_number: outlet.tax_number,
        receiptSettings: {
          logoUrl: outlet.receiptSettings?.logoUrl || '',
          footerText: outlet.receiptSettings?.footerText || '',
        },
      });

      // 2. Update loyalty and shift config settings
      await apiClient.put('/api/settings', {
        settings: {
          loyalty_earn_rate: loyaltyEarn,
          loyalty_redeem_rate: loyaltyRedeem,
          require_shift_open: String(requireShift),
        },
      });

      toast.success('Business profile and rules saved successfully');
      loadSettingsData();
    } catch (err) {
      toast.error('Error saving profile changes');
    }
  };

  // Open generic modal
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setIsModalOpen(true);

    if (item) {
      setFormName(item.name || item.label || '');
      if (type === 'outlet') {
        setFormField1(item.address || '');
        setFormField2(item.tax_number || '');
        setFormField3(item.receiptSettings?.footerText || '');
      } else if (type === 'user') {
        setFormField1(item.email || '');
        setFormField2(item.role || 'cashier');
      } else if (type === 'tax') {
        setFormField1(String(item.percentage || '0'));
      } else if (type === 'discount') {
        setFormField1(String(item.default_value || '0'));
        setFormField2(item.type || 'percentage');
      } else if (type === 'payment') {
        setFormField1(item.enabled ? 'true' : 'false');
      }
    } else {
      setFormName('');
      setFormField1('');
      setFormField2(type === 'user' ? 'cashier' : type === 'discount' ? 'percentage' : '');
      setFormField3('');
    }
  };

  // Submit generic modal form
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'outlet') {
        const payload = { name: formName, address: formField1, tax_number: formField2, receiptSettings: { footerText: formField3 } };
        if (editingItem) {
          await apiClient.put(`/api/outlets/${editingItem._id}`, payload);
        } else {
          await apiClient.post('/api/outlets', payload);
        }
      } else if (modalType === 'user') {
        if (editingItem) {
          await apiClient.put(`/api/users/${editingItem._id}`, { name: formName, role: formField2 });
        } else {
          await apiClient.post('/api/users', { name: formName, email: formField1, role: formField2 });
        }
      } else if (modalType === 'tax') {
        const payload = { name: formName, percentage: Number(formField1) };
        if (editingItem) {
          await apiClient.put(`/api/tax-rates/${editingItem._id}`, payload);
        } else {
          await apiClient.post('/api/tax-rates', payload);
        }
      } else if (modalType === 'discount') {
        const payload = { name: formName, type: formField2, default_value: Number(formField1) };
        if (editingItem) {
          await apiClient.put(`/api/discount-types/${editingItem._id}`, payload);
        } else {
          await apiClient.post('/api/discount-types', payload);
        }
      } else if (modalType === 'payment') {
        if (editingItem) {
          await apiClient.put(`/api/payment-methods/${editingItem._id}`, { name: formName, enabled: formField1 === 'true' });
        } else {
          await apiClient.post('/api/payment-methods', { name: formName, enabled: true });
        }
      }

      toast.success('Settings item saved successfully');
      setIsModalOpen(false);
      loadSettingsData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error processing request');
    }
  };

  const deleteItem = async (type, id) => {
    const confirm = window.confirm('Are you sure you want to delete this setting?');
    if (!confirm) return;

    try {
      if (type === 'outlet') await apiClient.delete(`/api/outlets/${id}`);
      else if (type === 'user') await apiClient.delete(`/api/users/${id}`);
      else if (type === 'tax') await apiClient.delete(`/api/tax-rates/${id}`);
      else if (type === 'discount') await apiClient.delete(`/api/discount-types/${id}`);
      else if (type === 'payment') await apiClient.delete(`/api/payment-methods/${id}`);

      toast.success('Setting item deleted');
      loadSettingsData();
    } catch (err) {
      toast.error('Error deleting settings item');
    }
  };

  // Section items configuration
  const sidebarItems = [
    { id: 'profile', label: 'Business Profile', icon: Building, roles: ['admin', 'manager', 'cashier'] },
    { id: 'outlets', label: 'Branch Outlets', icon: Store, roles: ['admin'] },
    { id: 'users', label: 'Staff Accounts', icon: Users, roles: ['admin'] },
    { id: 'taxes', label: 'Tax Rates', icon: Percent, roles: ['admin', 'manager'] },
    { id: 'discounts', label: 'Discounts config', icon: Ticket, roles: ['admin', 'manager'] },
    { id: 'payments', label: 'Payment Options', icon: Coins, roles: ['admin', 'manager'] },
    { id: 'shifts', label: 'Shifts Audit Log', icon: History, roles: ['admin', 'manager'] },
  ];

  const filteredSidebar = sidebarItems.filter((i) => i.roles.includes(user.role));

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Settings Sub-Sidebar */}
      <aside className="w-56 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-4 space-y-1 overflow-y-auto shrink-0 select-none">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Settings Panel</p>
        {filteredSidebar.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-3 h-10 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeSection === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-655 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <Icon className="w-4 h-4 mr-2.5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </aside>

      {/* Main Settings Panel */}
      <div className="flex-1 p-8 overflow-y-auto">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-605" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : activeSection === 'profile' && outlet ? (
          /* Profile & Rules panel */
          <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-6 animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Branch Profile & Business Rules</h3>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <FormField label="Outlet Branch Name" required>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={outlet.name}
                  onChange={(e) => setOutlet({ ...outlet, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm disabled:opacity-50"
                />
              </FormField>

              <FormField label="Address Location">
                <input
                  type="text"
                  disabled={!canEdit}
                  value={outlet.address || ''}
                  onChange={(e) => setOutlet({ ...outlet, address: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm disabled:opacity-50"
                />
              </FormField>

              <FormField label="Tax Registration / License Number">
                <input
                  type="text"
                  disabled={!canEdit}
                  value={outlet.tax_number || ''}
                  onChange={(e) => setOutlet({ ...outlet, tax_number: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm disabled:opacity-50"
                />
              </FormField>

              <FormField label="Default Receipt Footer Message">
                <input
                  type="text"
                  disabled={!canEdit}
                  value={outlet.receiptSettings?.footerText || ''}
                  onChange={(e) =>
                    setOutlet({
                      ...outlet,
                      receiptSettings: { ...outlet.receiptSettings, footerText: e.target.value },
                    })
                  }
                  placeholder="Thank you for shopping with us!"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm disabled:opacity-50"
                />
              </FormField>
            </div>

            {/* Rules panel */}
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Operation Safeguards & Loyalty settings</h3>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Force active shift opens</p>
                  <p className="text-[10px] text-slate-400">Cashiers cannot tender transactions if shift drawer is closed</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={requireShift}
                  onChange={(e) => setRequireShift(e.target.checked)}
                  className="w-5 h-5 rounded accent-indigo-605 cursor-pointer disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Loyalty Points Earn Rate (pts / ₹ spent)">
                  <input
                    type="number"
                    step="0.1"
                    disabled={!canEdit}
                    value={loyaltyEarn}
                    onChange={(e) => setLoyaltyEarn(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm disabled:opacity-50"
                  />
                </FormField>
                <FormField label="Loyalty Points Redeem value (₹ / point)">
                  <input
                    type="number"
                    step="0.001"
                    disabled={!canEdit}
                    value={loyaltyRedeem}
                    onChange={(e) => setLoyaltyRedeem(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm disabled:opacity-50"
                  />
                </FormField>
              </div>
            </div>

            {canEdit && (
              <Button type="submit" variant="primary" className="w-full h-11 rounded-xl font-bold">
                Save Changes
              </Button>
            )}
          </form>
        ) : activeSection === 'outlets' ? (
          /* Outlets list settings */
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Branch Outlets Management</h3>
              <Button variant="primary" icon={Plus} onClick={() => openModal('outlet')} className="!h-9 text-xs rounded-xl">
                Add Outlet
              </Button>
            </div>
            <DataTable
              columns={[
                { header: 'Branch Name', key: 'name', render: (row) => <span className="font-bold">{row.name}</span> },
                { header: 'Address', key: 'address' },
                { header: 'Tax ID', key: 'tax_number' },
                {
                  header: 'Actions',
                  key: 'actions',
                  render: (row) => (
                    <div className="flex space-x-2">
                      <button onClick={() => openModal('outlet', row)} className="p-2 text-slate-500 hover:text-indigo-650 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem('outlet', row._id)} className="p-2 text-slate-500 hover:text-rose-650 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={outlets}
              idKey="_id"
            />
          </div>
        ) : activeSection === 'users' ? (
          /* Staff Accounts list */
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Staff Accounts</h3>
              <Button variant="primary" icon={Plus} onClick={() => openModal('user')} className="!h-9 text-xs rounded-xl">
                Invite Staff
              </Button>
            </div>
            <DataTable
              columns={[
                { header: 'User Name', key: 'name', render: (row) => <span className="font-bold">{row.name}</span> },
                { header: 'Email ID', key: 'email' },
                {
                  header: 'Staff Role',
                  key: 'role',
                  render: (row) => (
                    <span className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded">
                      {row.role}
                    </span>
                  ),
                },
                {
                  header: 'Actions',
                  key: 'actions',
                  render: (row) => (
                    <div className="flex space-x-2">
                      <button onClick={() => openModal('user', row)} className="p-2 text-slate-500 hover:text-indigo-655 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem('user', row._id)} className="p-2 text-slate-500 hover:text-rose-650 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={users}
              idKey="_id"
            />
          </div>
        ) : activeSection === 'taxes' ? (
          /* Tax configurations */
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Branch Tax Rates</h3>
              {canEdit && (
                <Button variant="primary" icon={Plus} onClick={() => openModal('tax')} className="!h-9 text-xs rounded-xl">
                  Add Tax Rate
                </Button>
              )}
            </div>
            <DataTable
              columns={[
                { header: 'Tax Label', key: 'name', render: (row) => <span className="font-bold">{row.name}</span> },
                { header: 'Rate Percentage', key: 'percentage', render: (row) => <span className="font-bold">{row.percentage}%</span> },
                {
                  header: 'Actions',
                  key: 'actions',
                  render: (row) => (
                    <div className="flex space-x-2">
                      <button onClick={() => openModal('tax', row)} className="p-2 text-slate-500 hover:text-indigo-650 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem('tax', row._id)} className="p-2 text-slate-500 hover:text-rose-650 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={taxRates}
              idKey="_id"
            />
          </div>
        ) : activeSection === 'discounts' ? (
          /* Discounts configurations */
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Discount Types</h3>
              {canEdit && (
                <Button variant="primary" icon={Plus} onClick={() => openModal('discount')} className="!h-9 text-xs rounded-xl">
                  Add Discount
                </Button>
              )}
            </div>
            <DataTable
              columns={[
                { header: 'Discount Label', key: 'name', render: (row) => <span className="font-bold">{row.name}</span> },
                { header: 'Discount Type', key: 'type', render: (row) => <span className="text-xs uppercase font-bold">{row.type}</span> },
                {
                  header: 'Value',
                  key: 'default_value',
                  render: (row) => (
                    <span className="font-bold">
                      {row.type === 'percentage' ? `${row.default_value}%` : `₹${row.default_value}`}
                    </span>
                  ),
                },
                {
                  header: 'Actions',
                  key: 'actions',
                  render: (row) => (
                    <div className="flex space-x-2">
                      <button onClick={() => openModal('discount', row)} className="p-2 text-slate-500 hover:text-indigo-650 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem('discount', row._id)} className="p-2 text-slate-500 hover:text-rose-650 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={discountTypes}
              idKey="_id"
            />
          </div>
        ) : activeSection === 'payments' ? (
          /* Payment methods list */
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Payment Channels</h3>
              {canEdit && (
                <Button variant="primary" icon={Plus} onClick={() => openModal('payment')} className="!h-9 text-xs rounded-xl">
                  Add Payment Method
                </Button>
              )}
            </div>
            <DataTable
              columns={[
                { header: 'Method Name', key: 'name', render: (row) => <span className="font-bold">{row.name}</span> },
                { header: 'Status', key: 'enabled', render: (row) => <StatusBadge status={row.enabled ? 'active' : 'inactive'} /> },
                {
                  header: 'Actions',
                  key: 'actions',
                  render: (row) => (
                    <div className="flex space-x-2">
                      <button onClick={() => openModal('payment', row)} className="p-2 text-slate-500 hover:text-indigo-650 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem('payment', row._id)} className="p-2 text-slate-500 hover:text-rose-650 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={paymentMethods}
              idKey="_id"
            />
          </div>
        ) : activeSection === 'shifts' ? (
          /* Shifts auditing records */
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-50">Cash Drawer Shifts Audit History</h3>
            <DataTable
              columns={[
                { header: 'Cashier Staff', key: 'cashier_id.name', render: (row) => <span className="font-bold">{row.cashier_id?.name || 'Unknown'}</span> },
                { header: 'Opened At', key: 'start_time', render: (row) => <span>{new Date(row.start_time).toLocaleString()}</span> },
                { header: 'Closed At', key: 'end_time', render: (row) => <span>{row.end_time ? new Date(row.end_time).toLocaleString() : <span className="text-emerald-500 font-bold">Active Open</span>}</span> },
                { header: 'Opening Cash', key: 'opening_cash', render: (row) => <span>₹{row.opening_cash.toFixed(2)}</span> },
                { header: 'Expected Closing', key: 'closing_cash', render: (row) => <span>{row.closing_cash !== undefined ? `₹${row.closing_cash.toFixed(2)}` : 'N/A'}</span> },
                { header: 'Actual Closing', key: 'actual_closing_cash', render: (row) => <span>{row.actual_closing_cash !== undefined ? `₹${row.actual_closing_cash.toFixed(2)}` : 'N/A'}</span> },
                {
                  header: 'Discrepancy',
                  key: 'discrepancy',
                  render: (row) => {
                    if (row.closing_cash === undefined || row.actual_closing_cash === undefined) return <span>-</span>;
                    const diff = row.actual_closing_cash - row.closing_cash;
                    return (
                      <span className={`font-black ${diff === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {diff === 0 ? '₹0.00' : diff > 0 ? `+₹${diff.toFixed(2)}` : `-₹${Math.abs(diff).toFixed(2)}`}
                      </span>
                    );
                  },
                },
              ]}
              data={allShifts}
              idKey="_id"
            />
          </div>
        ) : null}
      </div>

      {/* Edit settings modals dialogs */}
      {isModalOpen && (
        <Modal
          title={editingItem ? `Edit ${modalType.toUpperCase()}` : `Add New ${modalType.toUpperCase()}`}
          onClose={() => setIsModalOpen(false)}
          size="sm"
        >
          <form onSubmit={handleModalSubmit} className="space-y-4">
            <FormField label="Label / Name" required>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Name"
                className="w-full h-11 px-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-sm focus:outline-none"
              />
            </FormField>

            {modalType === 'outlet' && (
              <>
                <FormField label="Address" required>
                  <input
                    type="text"
                    required
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    placeholder="123 POS St."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                  />
                </FormField>
                <FormField label="Tax / License ID">
                  <input
                    type="text"
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    placeholder="TAX-12345"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                  />
                </FormField>
                <FormField label="Footer Message">
                  <input
                    type="text"
                    value={formField3}
                    onChange={(e) => setFormField3(e.target.value)}
                    placeholder="Have a nice day!"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                  />
                </FormField>
              </>
            )}

            {modalType === 'user' && (
              <>
                {!editingItem && (
                  <FormField label="Email Address" required>
                    <input
                      type="email"
                      required
                      value={formField1}
                      onChange={(e) => setFormField1(e.target.value)}
                      placeholder="staff@pos.com"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                    />
                  </FormField>
                )}
                <FormField label="Access Role" required>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </FormField>
              </>
            )}

            {modalType === 'tax' && (
              <FormField label="Percentage Rate (%)" required>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formField1}
                  onChange={(e) => setFormField1(e.target.value)}
                  placeholder="5"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                />
              </FormField>
            )}

            {modalType === 'discount' && (
              <>
                <FormField label="Discount Value" required>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formField1}
                    onChange={(e) => setFormField1(e.target.value)}
                    placeholder="10"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                  />
                </FormField>
                <FormField label="Type" required>
                  <select
                    value={formField2}
                    onChange={(e) => setFormField2(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-transparent text-sm focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash Amount (₹)</option>
                  </select>
                </FormField>
              </>
            )}

            {modalType === 'payment' && (
              <FormField label="Status" required>
                <select
                  value={formField1}
                  onChange={(e) => setFormField1(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-202 bg-transparent text-sm focus:outline-none"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </FormField>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Item
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
