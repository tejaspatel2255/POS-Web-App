const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  variant_name: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // unit price at sale
  cost: { type: Number, default: 0 },
  tax_rate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxRate', default: null },
  tax_percentage: { type: Number, default: 0 },
  tax_amount: { type: Number, default: 0 },
});

const orderDiscountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  amount: { type: Number, required: true },
});

const orderTaxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
});

const orderPaymentSchema = new mongoose.Schema({
  method: { type: String, required: true },
  amount: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    outlet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      required: true,
      index: true,
    },
    cashier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    items: [orderItemSchema],
    discounts: [orderDiscountSchema],
    taxes: [orderTaxSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    tax_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    payments: [orderPaymentSchema],
    status: {
      type: String,
      enum: ['pending', 'completed', 'refunded', 'voided'],
      default: 'completed',
      index: true,
    },
    refund_reason: {
      type: String,
      default: '',
    },
    void_reason: {
      type: String,
      default: '',
    },
    refunded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    voided_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
