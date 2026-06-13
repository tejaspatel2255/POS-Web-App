import { create } from 'zustand';
import toast from 'react-hot-toast';

export const useCartStore = create((set, get) => ({
  cartItems: [],
  customer: null,
  orderDiscount: null, // { name, type, default_value, default_value }
  heldOrders: [], // array of cart snapshots: { id, customer, cartItems, orderDiscount, time }

  addToCart: (product, variant = null) => {
    const { cartItems } = get();
    const itemId = product._id;
    const variantName = variant ? variant.name : '';
    const price = variant ? variant.price : product.base_price;
    const cost = variant ? variant.cost : product.cost_price;

    const existingIndex = cartItems.findIndex(
      (item) => item.product._id === itemId && item.variantName === variantName
    );

    let updated;
    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex].quantity += 1;
    } else {
      updated = [
        ...cartItems,
        {
          product,
          variantName,
          quantity: 1,
          price,
          cost,
          taxRate: product.tax_rate_id || product.category_id?.tax_rate_id || null,
        },
      ];
    }

    set({ cartItems: updated });
    toast.success(`${product.name} ${variantName ? `(${variantName})` : ''} added to cart`);
  },

  removeFromCart: (productId, variantName = '') => {
    const { cartItems } = get();
    const updated = cartItems.filter(
      (item) => !(item.product._id === productId && item.variantName === variantName)
    );
    set({ cartItems: updated });
  },

  updateQuantity: (productId, qty, variantName = '') => {
    const { cartItems } = get();
    if (qty <= 0) {
      get().removeFromCart(productId, variantName);
      return;
    }

    const updated = cartItems.map((item) => {
      if (item.product._id === productId && item.variantName === variantName) {
        return { ...item, quantity: Number(qty) };
      }
      return item;
    });
    set({ cartItems: updated });
  },

  setCustomer: (customer) => set({ customer }),
  
  setDiscount: (discount) => {
    set({ orderDiscount: discount });
    if (discount) {
      toast.success(`Discount "${discount.name}" applied`);
    } else {
      toast.success('Discount removed');
    }
  },

  clearCart: () => set({ cartItems: [], customer: null, orderDiscount: null }),

  holdOrder: () => {
    const { cartItems, customer, orderDiscount, heldOrders } = get();
    if (cartItems.length === 0) {
      toast.error('Cart is empty, cannot hold order');
      return;
    }

    const snapshot = {
      id: Math.random().toString(36).substr(2, 9),
      customer,
      cartItems,
      orderDiscount,
      time: new Date(),
    };

    set({
      heldOrders: [...heldOrders, snapshot],
      cartItems: [],
      customer: null,
      orderDiscount: null,
    });
    toast.success('Order placed on hold');
  },

  recallOrder: (heldId) => {
    const { heldOrders } = get();
    const target = heldOrders.find((h) => h.id === heldId);
    if (!target) return;

    set({
      cartItems: target.cartItems,
      customer: target.customer,
      orderDiscount: target.orderDiscount,
      heldOrders: heldOrders.filter((h) => h.id !== heldId),
    });
    toast.success('Order recalled successfully');
  },

  removeHeldOrder: (heldId) => {
    const { heldOrders } = get();
    set({ heldOrders: heldOrders.filter((h) => h.id !== heldId) });
    toast.success('Held order deleted');
  },

  // Calculate Subtotal, Discounts, Taxes, and Final Total
  getTotals: () => {
    const { cartItems, orderDiscount } = get();

    // 1. Calculate items subtotal
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 2. Calculate Order-level Discount
    let discountAmount = 0;
    if (orderDiscount) {
      if (orderDiscount.type === 'percentage') {
        discountAmount = subtotal * (Number(orderDiscount.default_value) / 100);
      } else {
        discountAmount = Number(orderDiscount.default_value);
      }
    }
    // Cannot exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    // 3. Calculate Taxes
    // Ratio of discount to apply to each item for net price tax calculation
    const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 0;

    const taxSummaryMap = {};
    let totalTaxAmount = 0;

    cartItems.forEach((item) => {
      const itemSubtotal = item.price * item.quantity;
      const itemNetPrice = itemSubtotal * discountRatio;
      
      const taxRate = item.taxRate;
      if (taxRate && taxRate.percentage > 0) {
        const percentage = Number(taxRate.percentage);
        const itemTax = itemNetPrice * (percentage / 100);
        
        totalTaxAmount += itemTax;

        if (!taxSummaryMap[taxRate.name]) {
          taxSummaryMap[taxRate.name] = 0;
        }
        taxSummaryMap[taxRate.name] += itemTax;
      }
    });

    const taxes = Object.keys(taxSummaryMap).map((name) => ({
      name,
      amount: Number(taxSummaryMap[name].toFixed(2)),
    }));

    const total = Math.max(0, subtotal - discountAmount + totalTaxAmount);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      taxAmount: Number(totalTaxAmount.toFixed(2)),
      taxes,
      total: Number(total.toFixed(2)),
    };
  },
}));
