const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
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
    change: {
      type: Number,
      required: true, // +ve for restock, -ve for sale / damage / theft
    },
    reason: {
      type: String,
      required: true, // e.g. "Restock", "Sale", "Correction", "Damaged", etc.
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
