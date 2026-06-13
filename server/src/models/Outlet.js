const mongoose = require('mongoose');

const receiptSettingsSchema = new mongoose.Schema({
  logo: { type: String, default: '' },
  headerText: { type: String, default: '' },
  footerText: { type: String, default: 'Thank you for your business!' },
  showTaxNo: { type: Boolean, default: true },
  showCashier: { type: Boolean, default: true },
  showDiscount: { type: Boolean, default: true },
});

const outletSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    tax_number: {
      type: String,
      default: '',
    },
    receiptSettings: {
      type: receiptSettingsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Outlet', outletSchema);
