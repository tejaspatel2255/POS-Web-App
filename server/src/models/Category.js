const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    color: {
      type: String,
      default: '#4F46E5', // default Indigo
    },
    icon: {
      type: String,
      default: 'Folder',
    },
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
    tax_rate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxRate',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure category names are unique per outlet
categorySchema.index({ name: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
