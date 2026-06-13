const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const InventoryLog = require('../models/InventoryLog');

const getProducts = async (req, res) => {
  const { search, category, status } = req.query;
  const filter = { outlet_id: req.user.outlet_id };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    filter.category_id = category;
  }

  if (status) {
    filter.status = status;
  }

  try {
    const products = await Product.find(filter)
      .populate('category_id')
      .populate('tax_rate_id');
      
    // Include current inventory in the product response
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const inv = await Inventory.findOne({ product_id: product._id, outlet_id: req.user.outlet_id });
        return {
          ...product.toObject(),
          stock: inv ? inv.quantity : 0,
        };
      })
    );

    res.status(200).json(productsWithStock);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const createProduct = async (req, res) => {
  const {
    name,
    sku,
    barcode,
    category_id,
    base_price,
    cost_price,
    tax_rate_id,
    image_url,
    variants,
    stock_threshold,
    status,
    initial_stock, // Passed during creation
  } = req.body;

  if (!name || !sku || !category_id || base_price === undefined) {
    return res.status(400).json({ message: 'Name, SKU, Category, and Price are required' });
  }

  try {
    const product = new Product({
      name,
      sku,
      barcode,
      category_id,
      base_price,
      cost_price,
      tax_rate_id: tax_rate_id || null,
      image_url,
      variants: variants || [],
      stock_threshold: stock_threshold !== undefined ? stock_threshold : 5,
      status: status || 'active',
      outlet_id: req.user.outlet_id,
    });

    await product.save();

    // Initialize stock
    const qty = initial_stock !== undefined ? Number(initial_stock) : 0;
    await Inventory.create({
      product_id: product._id,
      outlet_id: req.user.outlet_id,
      quantity: qty,
    });

    // Log if initial stock is added
    if (qty > 0) {
      await InventoryLog.create({
        product_id: product._id,
        outlet_id: req.user.outlet_id,
        change: qty,
        reason: 'Initial Stock',
        user_id: req.user._id,
      });
    }

    const populatedProduct = await Product.findById(product._id)
      .populate('category_id')
      .populate('tax_rate_id');

    res.status(201).json({
      ...populatedProduct.toObject(),
      stock: qty,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A product with this SKU already exists in this outlet' });
    }
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = req.body;
    
    // Update fields
    const fieldsToUpdate = [
      'name', 'sku', 'barcode', 'category_id', 'base_price', 'cost_price',
      'tax_rate_id', 'image_url', 'variants', 'stock_threshold', 'status'
    ];

    fieldsToUpdate.forEach((field) => {
      if (updates[field] !== undefined) {
        if (field === 'category_id' || field === 'tax_rate_id') {
          product[field] = updates[field] || null;
        } else {
          product[field] = updates[field];
        }
      }
    });

    await product.save();

    const populated = await Product.findById(product._id)
      .populate('category_id')
      .populate('tax_rate_id');

    const inv = await Inventory.findOne({ product_id: product._id, outlet_id: req.user.outlet_id });

    res.status(200).json({
      ...populated.toObject(),
      stock: inv ? inv.quantity : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, outlet_id: req.user.outlet_id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Clean up inventory & logs
    await Inventory.deleteOne({ product_id: req.params.id, outlet_id: req.user.outlet_id });
    await InventoryLog.deleteMany({ product_id: req.params.id, outlet_id: req.user.outlet_id });

    res.status(200).json({ message: 'Product and inventory records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

const bulkDeleteProducts = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'IDs array is required' });
  }

  try {
    await Product.deleteMany({ _id: { $in: ids }, outlet_id: req.user.outlet_id });
    await Inventory.deleteMany({ product_id: { $in: ids }, outlet_id: req.user.outlet_id });
    await InventoryLog.deleteMany({ product_id: { $in: ids }, outlet_id: req.user.outlet_id });

    res.status(200).json({ message: 'Products deleted in bulk successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error during bulk deletion', error: error.message });
  }
};

const importProductsCSV = async (req, res) => {
  const { products } = req.body; // Array of product JSON objects
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'No products provided for import' });
  }

  try {
    const importLogs = [];
    let successCount = 0;

    for (const prodData of products) {
      try {
        const { name, sku, barcode, category_name, base_price, cost_price, initial_stock } = prodData;

        // Skip incomplete rows
        if (!name || !sku || base_price === undefined) {
          importLogs.push({ sku: sku || 'UNKNOWN', status: 'Failed', reason: 'Missing name, SKU, or base price' });
          continue;
        }

        // Check if Category exists, otherwise find or link default (or create)
        // For simplicity, let's look up category by name (case-insensitive) or fail
        const Category = require('../models/Category');
        let category = await Category.findOne({
          name: { $regex: `^${category_name}$`, $options: 'i' },
          outlet_id: req.user.outlet_id,
        });

        if (!category) {
          // Auto create category
          category = new Category({
            name: category_name || 'Uncategorized',
            outlet_id: req.user.outlet_id,
          });
          await category.save();
        }

        // Check for duplicates
        const dup = await Product.findOne({ sku, outlet_id: req.user.outlet_id });
        if (dup) {
          importLogs.push({ sku, status: 'Failed', reason: 'Duplicate SKU' });
          continue;
        }

        const product = new Product({
          name,
          sku,
          barcode: barcode || '',
          category_id: category._id,
          base_price: Number(base_price),
          cost_price: cost_price ? Number(cost_price) : 0,
          outlet_id: req.user.outlet_id,
        });

        await product.save();

        const qty = initial_stock !== undefined ? Number(initial_stock) : 0;
        await Inventory.create({
          product_id: product._id,
          outlet_id: req.user.outlet_id,
          quantity: qty,
        });

        if (qty > 0) {
          await InventoryLog.create({
            product_id: product._id,
            outlet_id: req.user.outlet_id,
            change: qty,
            reason: 'CSV Import Stock',
            user_id: req.user._id,
          });
        }

        successCount++;
        importLogs.push({ sku, status: 'Success' });
      } catch (err) {
        importLogs.push({ sku: prodData.sku || 'UNKNOWN', status: 'Failed', reason: err.message });
      }
    }

    res.status(200).json({
      message: `Import completed. Successfully imported ${successCount} products.`,
      logs: importLogs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error importing products', error: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  importProductsCSV,
};
