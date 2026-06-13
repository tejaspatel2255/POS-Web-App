const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One key-value pair per outlet
settingsSchema.index({ key: 1, outlet_id: 1 }, { unique: true });

module.exports = mongoose.model('Settings', settingsSchema);
