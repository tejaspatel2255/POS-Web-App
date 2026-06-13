const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    cashier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    start_time: {
      type: Date,
      default: Date.now,
    },
    end_time: {
      type: Date,
      default: null,
    },
    opening_cash: {
      type: Number,
      required: true,
      min: 0,
    },
    closing_cash: {
      type: Number,
      default: 0,
    },
    actual_closing_cash: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Shift', shiftSchema);
