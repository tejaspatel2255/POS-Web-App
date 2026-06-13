const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    loyalty_points: {
      type: Number,
      default: 0,
      min: 0,
    },
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Unique phone per outlet
customerSchema.index({ phone: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
