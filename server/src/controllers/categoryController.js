const Category = require('../models/Category');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ outlet_id: req.user.outlet_id })
      .sort({ sort_order: 1 })
      .populate('parent_id')
      .populate('tax_rate_id');
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

const createCategory = async (req, res) => {
  const { name, parent_id, color, icon, tax_rate_id } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    // Get max sort order to append to the end
    const lastCategory = await Category.findOne({ outlet_id: req.user.outlet_id })
      .sort({ sort_order: -1 });
    const nextOrder = lastCategory ? lastCategory.sort_order + 1 : 0;

    const category = new Category({
      name,
      parent_id: parent_id || null,
      color,
      icon,
      tax_rate_id: tax_rate_id || null,
      outlet_id: req.user.outlet_id,
      sort_order: nextOrder,
    });

    await category.save();
    const populated = await Category.findById(category._id)
      .populate('parent_id')
      .populate('tax_rate_id');
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A category with this name already exists in this outlet' });
    }
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

const updateCategory = async (req, res) => {
  const { name, parent_id, color, icon, tax_rate_id } = req.body;
  try {
    const category = await Category.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) category.name = name;
    category.parent_id = parent_id || null;
    if (color) category.color = color;
    if (icon) category.icon = icon;
    category.tax_rate_id = tax_rate_id || null;

    await category.save();
    const populated = await Category.findById(category._id)
      .populate('parent_id')
      .populate('tax_rate_id');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Set any children's parent_id to null
    await Category.updateMany({ parent_id: req.params.id }, { parent_id: null });

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

const reorderCategories = async (req, res) => {
  const { orders } = req.body; // Array of { _id, sort_order }
  if (!Array.isArray(orders)) {
    return res.status(400).json({ message: 'Orders array is required' });
  }

  try {
    const bulkOps = orders.map((item) => ({
      updateOne: {
        filter: { _id: item._id, outlet_id: req.user.outlet_id },
        update: { $set: { sort_order: item.sort_order } },
      },
    }));

    await Category.bulkWrite(bulkOps);
    res.status(200).json({ message: 'Category order updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error reordering categories', error: error.message });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
};
