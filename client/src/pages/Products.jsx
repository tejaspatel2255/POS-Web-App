import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  Upload,
  Search,
  RefreshCw,
  FolderOpen,
  Info,
  X,
} from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';
import StatusBadge from '../components/ui/StatusBadge';

export default function Products() {
  const [products, setProducts] = useState([]);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [categories, setCategories] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Multi-select actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [stockThreshold, setStockThreshold] = useState('5');
  const [initialStock, setInitialStock] = useState('0');
  const [status, setStatus] = useState('active');
  const [variants, setVariants] = useState([]); // [{ name, price, cost }]

  // CSV Import Modal states
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // Variant helper states
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newVarCost, setNewVarCost] = useState('');

  const fetchCatalogData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes, taxRes] = await Promise.all([
        apiClient.get('/api/products'),
        apiClient.get('/api/categories'),
        apiClient.get('/api/tax-rates'),
      ]);
      setProducts(prodsRes.data);
      setCategories(catsRes.data);
      setTaxRates(taxRes.data);
    } catch (err) {
      toast.error('Error loading catalog lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const openAddForm = () => {
    setEditingProduct(null);
    setName('');
    setSku(`PROD-${Math.floor(1000 + Math.random() * 9000)}`);
    setBarcode('');
    setCategory(categories[0]?._id || '');
    setBasePrice('');
    setCostPrice('');
    setTaxRate(taxRates[0]?._id || '');
    setStockThreshold('5');
    setInitialStock('0');
    setStatus('active');
    setVariants([]);
    setIsFormOpen(true);
  };

  const openEditForm = (prod) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setBarcode(prod.barcode || '');
    setCategory(prod.category_id?.id || prod.category_id?._id || '');
    setBasePrice(String(prod.base_price));
    setCostPrice(prod.cost_price ? String(prod.cost_price) : '');
    setTaxRate(prod.tax_rate_id?.id || prod.tax_rate_id?._id || '');
    setStockThreshold(String(prod.stock_threshold));
    setInitialStock(String(prod.stock || 0));
    setStatus(prod.status);
    setVariants(prod.variants || []);
    setIsFormOpen(true);
  };

  // Add/Edit action handlers
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !sku || !category || !basePrice) {
      toast.error('Please fill in required fields');
      return;
    }

    setFormLoading(true);
    const payload = {
      name,
      sku,
      barcode,
      category_id: category,
      base_price: Number(basePrice),
      cost_price: costPrice ? Number(costPrice) : 0,
      tax_rate_id: taxRate || null,
      stock_threshold: Number(stockThreshold),
      status,
      variants,
    };

    try {
      if (editingProduct) {
        await apiClient.put(`/api/products/${editingProduct._id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await apiClient.post('/api/products', {
          ...payload,
          initial_stock: Number(initialStock),
        });
        toast.success('Product added successfully');
      }
      setIsFormOpen(false);
      fetchCatalogData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error saving product');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this product? All inventory logs will be removed.');
    if (!confirm) return;

    try {
      await apiClient.delete(`/api/products/${id}`);
      toast.success('Product deleted successfully');
      fetchCatalogData();
    } catch (err) {
      toast.error('Error deleting product');
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = window.confirm(`Are you sure you want to delete ${selectedIds.length} products in bulk?`);
    if (!confirm) return;

    try {
      await apiClient.post('/api/products/bulk-delete', { ids: selectedIds });
      toast.success('Selected products deleted successfully');
      setSelectedIds([]);
      fetchCatalogData();
    } catch (err) {
      toast.error('Error during bulk deletion');
    }
  };

  // Parse CSV
  const handleImportCSVSubmit = async (e) => {
    e.preventDefault();
    if (!csvText) return;

    setImportLoading(true);
    try {
      // Basic CSV Parser: header: name,sku,barcode,category_name,base_price,cost_price,initial_stock
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const list = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map((c) => c.trim());
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx];
        });
        list.push(rowObj);
      }

      const res = await apiClient.post('/api/products/import', { products: list });
      toast.success(res.data.message);
      setIsImportOpen(false);
      setCsvText('');
      fetchCatalogData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing CSV upload');
    } finally {
      setImportLoading(false);
    }
  };

  // Add Variant helper
  const addVariant = () => {
    if (!newVarName || !newVarPrice) return;
    setVariants([
      ...variants,
      {
        name: newVarName,
        price: Number(newVarPrice),
        cost: newVarCost ? Number(newVarCost) : 0,
      },
    ]);
    setNewVarName('');
    setNewVarPrice('');
    setNewVarCost('');
  };

  const removeVariant = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  // Filter lists locally
  const filteredProducts = products.filter((p) => {
    const catId = p.category_id?.id || p.category_id?._id;
    const matchesCategory = selectedCategory === 'all' || catId === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const toggleSelectProduct = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      key: 'name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200">{row.name}</span>
          {row.variants?.length > 0 && (
            <span className="ml-2 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
              {row.variants.length} Variants
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'SKU',
      key: 'sku',
      render: (row) => <span className="font-semibold text-xs">{row.sku}</span>,
    },
    {
      header: 'Category',
      key: 'category_id',
      render: (row) => (
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: row.category_id?.color || '#94A3B8' }}
        >
          {row.category_id?.name || 'Uncategorized'}
        </span>
      ),
    },
    {
      header: 'Retail Price',
      key: 'base_price',
      render: (row) => <span className="font-extrabold">₹{row.base_price.toFixed(2)}</span>,
    },
    {
      header: 'Stock',
      key: 'stock',
      render: (row) => (
        <span
          className={`font-black text-xs ${
            row.stock <= row.stock_threshold ? 'text-rose-500' : 'text-slate-700 dark:text-slate-350'
          }`}
        >
          {row.stock} / min: {row.stock_threshold}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditForm(row)}
            className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteProduct(row._id)}
            className="p-2 text-slate-500 hover:text-rose-650 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title="Product Catalog Management">
        <div className="space-x-2 flex">
          <Button variant="secondary" icon={Upload} onClick={() => setIsImportOpen(true)}>
            Import CSV
          </Button>
          <Button variant="primary" icon={Plus} onClick={openAddForm}>
            Add Product
          </Button>
        </div>
      </PageHeader>      {/* Filters & Bulk Operations bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, name, barcode..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selected rows action */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between sm:justify-start space-x-3 bg-rose-50/50 dark:bg-rose-950/20 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-900/40 w-full sm:w-auto">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {selectedIds.length} Selected
            </span>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={handleBulkDelete}
              className="!h-8 !px-2.5 rounded-lg text-xs"
            >
              Delete Bulk
            </Button>
          </div>
        )}
      </div>

      {/* Grid List Table / Cards */}
      {isMobile ? (
        loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-indigo-650" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.stock_threshold;
              const isSelected = selectedIds.includes(p._id);
              return (
                <div
                  key={p._id}
                  className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                    isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(p._id)}
                        className="mt-1 rounded border-slate-350 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{p.sku}</p>
                        {p.variants?.length > 0 && (
                          <span className="inline-block mt-1 text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 px-1.5 py-0.5 rounded font-bold">
                            {p.variants.length} Variants
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: p.category_id?.color || '#94A3B8' }}
                    >
                      {p.category_id?.name || 'Uncategorized'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Stock Level</p>
                      <p className={`text-xs font-black mt-0.5 ${isLowStock ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {p.stock} / min: {p.stock_threshold}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Retail Price</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-50 mt-0.5">
                        ₹{p.base_price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <StatusBadge status={p.status} />
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => openEditForm(p)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs font-bold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 cursor-pointer flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
            <ShoppingBag className="w-10 h-10 text-slate-305 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-505 dark:text-slate-400">No products inside catalog</p>
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          isLoading={loading}
          idKey="_id"
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyState={
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-slate-305 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-505 dark:text-slate-400">No products inside catalog</p>
            </div>
          }
        />
      )}

      {/* Product Add/Edit Form Wizard Modal */}
      {isFormOpen && (
        <Modal
          title={editingProduct ? 'Modify Product Catalog Details' : 'Add New Product to Catalog'}
          onClose={() => setIsFormOpen(false)}
          size="lg"
        >
          <form onSubmit={handleFormSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Product Name" required>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Premium Blend Coffee Beans"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                />
              </FormField>

              <FormField label="SKU Code" required>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                />
              </FormField>

              <FormField label="Barcode (UPC/EAN)">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or type barcode"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                />
              </FormField>

              <FormField label="Product Category" required>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Base/Retail Price (₹)" required>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                />
              </FormField>

              <FormField label="Cost Price (₹)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                />
              </FormField>

              <FormField label="Tax Rate">
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                >
                  <option value="">No Tax / Exempt</option>
                  {taxRates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.percentage}%)
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Low Stock Threshold">
                <input
                  type="number"
                  min="0"
                  value={stockThreshold}
                  onChange={(e) => setStockThreshold(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                />
              </FormField>

              {!editingProduct && (
                <FormField label="Opening Inventory Stock Quantity">
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    placeholder="0"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                  />
                </FormField>
              )}

              <FormField label="Listing Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
            </div>

            {/* Product Variants Configuration */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase mb-3 flex items-center">
                Configure Product Variants (Optional)
              </h4>
              
              {/* Added variants */}
              <div className="flex flex-wrap gap-2 mb-4">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900 text-xs font-bold"
                  >
                    <span>
                      {v.name} (Sell: ₹{v.price.toFixed(2)} | Cost: ₹{v.cost ? v.cost.toFixed(2) : '0.00'})
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="text-rose-500 font-extrabold ml-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Variant Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <FormField label="Variant Name">
                  <input
                    type="text"
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="e.g. Size: Large"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  />
                </FormField>
                <FormField label="Retail Price (₹)">
                  <input
                    type="number"
                    step="0.01"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  />
                </FormField>
                <FormField label="Cost Price (₹)">
                  <input
                    type="number"
                    step="0.01"
                    value={newVarCost}
                    onChange={(e) => setNewVarCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs"
                  />
                </FormField>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="mt-2.5 inline-flex items-center text-xs font-bold text-indigo-650 hover:text-indigo-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant Option
              </button>
            </div>

            <div className="flex justify-end space-x-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={formLoading}>
                Save Product
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* CSV Import Modal */}
      {isImportOpen && (
        <Modal
          title="Import Products catalog from CSV"
          onClose={() => setIsImportOpen(false)}
          size="md"
        >
          <form onSubmit={handleImportCSVSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 font-semibold space-y-1">
              <p className="font-bold flex items-center text-slate-650">
                <Info className="w-3.5 h-3.5 mr-1 text-indigo-500" /> CSV Format Guideline:
              </p>
              <p>The first line must contain exactly the headers below (case-insensitive):</p>
              <pre className="p-2 bg-slate-200 dark:bg-slate-950 rounded text-slate-700 dark:text-slate-350 block select-all font-mono">
                name,sku,barcode,category_name,base_price,cost_price,initial_stock
              </pre>
            </div>

            <FormField label="Paste Raw CSV Text Content" required>
              <textarea
                required
                rows="8"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Premium Beans,BEANS-01,999123,Coffee,12.99,6.50,50"
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>

            <div className="flex space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setIsImportOpen(false)} disabled={importLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={importLoading}>
                Start CSV Import
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
