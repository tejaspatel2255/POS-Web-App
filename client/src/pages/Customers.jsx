import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Eye, DollarSign, Calendar, RefreshCw } from 'lucide-react';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';

export default function Customers() {
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState('0');

  // Profile Modal states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/customers?search=${searchQuery}`);
      setCustomers(res.data);
    } catch (err) {
      toast.error('Error fetching customers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openAddForm = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setLoyaltyPoints('0');
    setIsFormOpen(true);
  };

  const openEditForm = (cust) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setLoyaltyPoints(String(cust.loyalty_points));
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) return;

    setFormLoading(true);
    const payload = {
      name,
      phone,
      email,
      loyalty_points: Number(loyaltyPoints),
    };

    try {
      if (editingCustomer) {
        await apiClient.put(`/api/customers/${editingCustomer._id}`, payload);
        toast.success('Customer profile updated');
      } else {
        await apiClient.post('/api/customers', payload);
        toast.success('Customer registered successfully');
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving customer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this customer? Historical transaction totals will be preserved, but customer records will be detached.');
    if (!confirm) return;

    try {
      await apiClient.delete(`/api/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err) {
      toast.error('Error deleting customer');
    }
  };

  // Inspect Profile
  const inspectCustomerProfile = async (id) => {
    setProfileLoading(true);
    setIsProfileOpen(true);
    try {
      const res = await apiClient.get(`/api/customers/${id}`);
      setProfileData(res.data);
    } catch (err) {
      toast.error('Error fetching customer audit log');
      setIsProfileOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      key: 'name',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{row.name}</span>,
    },
    {
      header: 'Phone Number',
      key: 'phone',
      render: (row) => <span className="font-semibold">{row.phone}</span>,
    },
    {
      header: 'Email',
      key: 'email',
      render: (row) => <span className="text-xs">{row.email || <span className="text-slate-400 italic">None</span>}</span>,
    },
    {
      header: 'Loyalty Points',
      key: 'loyalty_points',
      render: (row) => (
        <span className="font-bold text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-2 py-0.5 rounded-full">
          {row.loyalty_points}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-1.5">
          <Button
            variant="secondary"
            icon={Eye}
            onClick={() => inspectCustomerProfile(row._id)}
            className="!h-8 !px-2.5 rounded-lg text-xs"
          >
            Audit
          </Button>
          <button
            onClick={() => openEditForm(row)}
            className="p-2 text-slate-500 hover:text-indigo-650 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => handleDeleteCustomer(row._id)}
              className="p-2 text-slate-500 hover:text-rose-650 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Customer CRM Directory">
        <Button variant="primary" icon={Plus} onClick={openAddForm}>
          Add Customer
        </Button>
      </PageHeader>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center shrink-0">
        <div className="relative w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone number..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-55 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Grid list Table */}
      <DataTable
        columns={columns}
        data={customers}
        isLoading={loading}
        idKey="_id"
        emptyState={
          <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
            <Users className="w-10 h-10 text-slate-350 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-505 dark:text-slate-400">No customers registered in this branch</p>
          </div>
        }
      />

      {/* Add/Edit customer profile modal */}
      {isFormOpen && (
        <Modal
          title={editingCustomer ? 'Modify Customer Profile' : 'Register New Customer'}
          onClose={() => setIsFormOpen(false)}
          size="sm"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormField label="Full Name" required>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full h-11 px-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
              />
            </FormField>

            <FormField label="Phone Number" required>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full h-11 px-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
              />
            </FormField>

            <FormField label="Email Address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.smith@example.com"
                className="w-full h-11 px-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
              />
            </FormField>

            <FormField label="Starting Loyalty Points">
              <input
                type="number"
                min="0"
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
              />
            </FormField>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={formLoading}>
                Save Profile
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Profile Detail Audit view Modal */}
      {isProfileOpen && (
        <Modal
          title="Customer Profile & Transaction Audit"
          onClose={() => {
            setIsProfileOpen(false);
            setProfileData(null);
          }}
          size="lg"
        >
          {profileLoading ? (
            <div className="h-48 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : profileData ? (
            <div className="space-y-6">
              {/* Stats overview cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">Total Spent</span>
                    <span className="text-base font-extrabold text-slate-850 dark:text-slate-50 mt-0.5">
                      ${profileData.totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">Visits Count</span>
                    <span className="text-base font-extrabold text-slate-850 dark:text-slate-50 mt-0.5">
                      {profileData.visitCount} times
                    </span>
                  </div>
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-450 uppercase block">Points Balance</span>
                    <span className="text-base font-extrabold text-slate-850 dark:text-slate-50 mt-0.5">
                      {profileData.customer.loyalty_points} pts
                    </span>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Purchase history table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Purchase History Logs</h4>
                <div className="max-h-60 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 text-slate-405 font-bold uppercase border-b border-slate-100 dark:border-slate-800">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-650 dark:text-slate-350">
                      {profileData.purchaseHistory.length > 0 ? (
                        profileData.purchaseHistory.map((order) => (
                          <tr key={order._id}>
                            <td className="p-3 font-bold text-indigo-650">
                              {order._id.substring(order._id.length - 8).toUpperCase()}
                            </td>
                            <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 capitalize">{order.status}</td>
                            <td className="p-3 font-extrabold text-right text-slate-900 dark:text-slate-100">
                              ${order.total.toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="p-6 text-center text-slate-400 font-semibold">
                            No purchases recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setProfileData(null);
                  }}
                >
                  Close Profile
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
