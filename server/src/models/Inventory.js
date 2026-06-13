const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One inventory record per product per outlet
inventorySchema.index({ product_id: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
