const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Size: S", "Color: Blue"
  sku: { type: String, required: true },
  price: { type: Number, required: true },
  cost: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      index: true,
    },
    barcode: {
      type: String,
      default: '',
      index: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    base_price: {
      type: Number,
      required: true,
      min: 0,
    },
    cost_price: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax_rate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxRate',
      default: null,
    },
    image_url: {
      type: String,
      default: '',
    },
    variants: [variantSchema],
    stock_threshold: {
      type: Number,
      default: 5,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// SKU should be unique per outlet
productSchema.index({ sku: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
