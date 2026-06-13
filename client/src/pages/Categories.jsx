import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit, Trash2, ArrowUpDown, RefreshCw } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [sortOrder, setSortOrder] = useState('0');

  // Reordering states
  const [reorderList, setReorderList] = useState([]); // [{ id, sort_order }]
  const [isReordering, setIsReordering] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/categories');
      setCategories(res.data);
      // Initialize reorder state mapping
      setReorderList(res.data.map((c) => ({ id: c._id, sort_order: c.sort_order })));
    } catch (err) {
      toast.error('Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddForm = () => {
    setEditingCategory(null);
    setName('');
    setColor('#4F46E5');
    setSortOrder(String(categories.length));
    setIsFormOpen(true);
  };

  const openEditForm = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color);
    setSortOrder(String(cat.sort_order));
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    setFormLoading(true);
    const payload = {
      name,
      color,
      sort_order: Number(sortOrder),
    };

    try {
      if (editingCategory) {
        await apiClient.put(`/api/categories/${editingCategory._id}`, payload);
        toast.success('Category updated successfully');
      } else {
        await apiClient.post('/api/categories', payload);
        toast.success('Category created successfully');
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error saving category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this category? Products linked to it will not be deleted but they will become uncategorized.');
    if (!confirm) return;

    try {
      await apiClient.delete(`/api/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (err) {
      toast.error('Error deleting category');
    }
  };

  // Reorder sort_order modification
  const handleSortOrderChange = (id, value) => {
    const updated = reorderList.map((item) => {
      if (item.id === id) {
        return { ...item, sort_order: Number(value) };
      }
      return item;
    });
    setReorderList(updated);
  };

  // Save updated sort order list to backend
  const handleSaveReorder = async () => {
    setIsReordering(true);
    try {
      await apiClient.post('/api/categories/reorder', { orders: reorderList });
      toast.success('Categories order sorted successfully');
      fetchCategories();
    } catch (err) {
      toast.error('Error reordering categories');
    } finally {
      setIsReordering(false);
    }
  };

  const columns = [
    {
      header: 'Color Chip',
      key: 'color',
      render: (row) => (
        <span
          className="w-6 h-6 rounded-lg inline-block border border-slate-200 shadow-sm"
          style={{ backgroundColor: row.color }}
        />
      ),
    },
    {
      header: 'Category Name',
      key: 'name',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{row.name}</span>,
    },
    {
      header: 'Sort Priority',
      key: 'sort_order',
      render: (row) => {
        const matchingReorderItem = reorderList.find((item) => item.id === row._id);
        return (
          <input
            type="number"
            value={matchingReorderItem ? matchingReorderItem.sort_order : row.sort_order}
            onChange={(e) => handleSortOrderChange(row._id, e.target.value)}
            className="w-16 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        );
      },
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
            onClick={() => handleDeleteCategory(row._id)}
            className="p-2 text-slate-500 hover:text-rose-650 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Product Categories Panel">
        <div className="space-x-2 flex">
          <Button variant="secondary" icon={ArrowUpDown} onClick={handleSaveReorder} loading={isReordering}>
            Save Sorted Order
          </Button>
          <Button variant="primary" icon={Plus} onClick={openAddForm}>
            Add Category
          </Button>
        </div>
      </PageHeader>

      {/* Grid List Table */}
      <DataTable
        columns={columns}
        data={categories}
        isLoading={loading}
        idKey="_id"
        emptyState={
          <div className="text-center p-12 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-505 dark:text-slate-400">No categories found</p>
          </div>
        }
      />

      {/* Add/Edit Modal */}
      {isFormOpen && (
        <Modal
          title={editingCategory ? 'Edit Product Category' : 'Create Product Category'}
          onClose={() => setIsFormOpen(false)}
          size="sm"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormField label="Category Name" required>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Beverages"
                className="w-full h-11 px-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>

            <FormField label="Sort Order Sequence">
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </FormField>

            <FormField label="Color Code / Tag">
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 border border-slate-200 rounded-xl cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-500">{color.toUpperCase()}</span>
              </div>
            </FormField>

            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={formLoading}>
                Save Category
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
