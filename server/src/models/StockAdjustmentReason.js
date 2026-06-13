const mongoose = require('mongoose');

const stockAdjustmentReasonSchema = new mongoose.Schema(
  {
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique label per outlet
stockAdjustmentReasonSchema.index({ label: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('StockAdjustmentReason', stockAdjustmentReasonSchema);
