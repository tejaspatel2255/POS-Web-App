const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
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
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentMethodSchema.index({ name: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
