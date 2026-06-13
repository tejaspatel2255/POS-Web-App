const mongoose = require('mongoose');

const discountTypeSchema = new mongoose.Schema(
  {
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    default_value: {
      type: Number,
      required: true,
      min: 0,
    },
    requires_approval: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

discountTypeSchema.index({ name: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('DiscountType', discountTypeSchema);
