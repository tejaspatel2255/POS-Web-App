const mongoose = require('mongoose');

const taxRateSchema = new mongoose.Schema(
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
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Unique tax rate name per outlet
taxRateSchema.index({ name: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('TaxRate', taxRateSchema);
