import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Percent,
  Folder,
  X,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  FolderHeart,
  HelpCircle,
  TrendingDown,
  Printer,
  Sparkles,
  Square,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useShiftStore } from '../store/useShiftStore';
import { supabase } from '../utils/supabaseClient';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FormField from '../components/ui/FormField';

export default function PosTerminal() {
  const { user } = useAuthStore();
  const { currentShift } = useShiftStore();
  const {
    cartItems,
    customer,
    orderDiscount,
    heldOrders,
    addToCart,
    removeFromCart,
    updateQuantity,
    setCustomer,
    setDiscount,
    clearCart,
    holdOrder,
    recallOrder,
    removeHeldOrder,
    getTotals,
  } = useCartStore();

  // API Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [discountTypes, setDiscountTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [requireShiftOpen, setRequireShiftOpen] = useState(false);
  const [loyaltyRules, setLoyaltyRules] = useState({ earn: 1, redeem: 0.01 });

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals States
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [activeProductForVariants, setActiveProductForVariants] = useState(null);
  
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPayments, setCheckoutPayments] = useState([{ method: 'Cash', amount: 0 }]);
  const [cashTendered, setCashTendered] = useState('');
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);

  const [isRecallModalOpen, setIsRecallModalOpen] = useState(false);

  // Initialize and Fetch POS data
  const loadPOSData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes, custsRes, discRes, payRes, setRes] = await Promise.all([
        apiClient.get('/api/products'),
        apiClient.get('/api/categories'),
        apiClient.get('/api/customers'),
        apiClient.get('/api/discount-types'),
        apiClient.get('/api/payment-methods'),
        apiClient.get('/api/settings'),
      ]);

      setProducts(prodsRes.data);
      setCategories(catsRes.data);
      setCustomers(custsRes.data);
      setDiscountTypes(discRes.data);
      setPaymentMethods(payRes.data.filter((m) => m.enabled));
      
      const config = setRes.data.settings || {};
      setRequireShiftOpen(config.require_shift_open === 'true' || config.require_shift_open === true);
      setLoyaltyRules({
        earn: Number(config.loyalty_earn_rate || 1),
        redeem: Number(config.loyalty_redeem_rate || 0.01),
      });

    } catch (err) {
      toast.error('Error loading terminal catalog data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPOSData();
    }
  }, [user]);

  // Filter products based on search and category
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category_id?._id === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Totals calculations
  const totals = getTotals();

  // Check if checkout button should be active
  const isShiftValid = !requireShiftOpen || currentShift;

  const handleProductCardClick = (product) => {
    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    
    if (product.variants && product.variants.length > 0) {
      setActiveProductForVariants(product);
      setIsVariantModalOpen(true);
    } else {
      addToCart(product);
    }
  };

  // Add Customer Quick Create
  const handleQuickCustomerCreate = async (e) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;

    try {
      const res = await apiClient.post('/api/customers', {
        name: newCustomerName,
        phone: newCustomerPhone,
        email: newCustomerEmail,
      });
      setCustomers([...customers, res.data]);
      setCustomer(res.data);
      setIsCustomerModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      toast.success('Customer registered and attached to sale');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error registering customer');
    }
  };

  // Setup checkout defaults when checkout modal opens
  const openCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (!isShiftValid) {
      toast.error('Drawer Shift is Closed. Please open a shift from the topbar first.');
      return;
    }
    
    // Set default payment method to the first enabled one
    const defaultMethod = paymentMethods.length > 0 ? paymentMethods[0].name : 'Cash';
    setCheckoutPayments([{ method: defaultMethod, amount: totals.total }]);
    setCashTendered(String(totals.total));
    setRedeemedPoints(0);
    setIsCheckoutModalOpen(true);
  };

  const addSplitPayment = () => {
    // Distribute remaining amount
    const allocated = checkoutPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, totals.total - allocated);
    const defaultMethod = paymentMethods.length > 0 ? paymentMethods[0].name : 'Cash';

    setCheckoutPayments([...checkoutPayments, { method: defaultMethod, amount: remaining }]);
  };

  const removeSplitPayment = (index) => {
    const updated = checkoutPayments.filter((_, idx) => idx !== index);
    setCheckoutPayments(updated);
  };

  const handlePaymentMethodChange = (index, field, value) => {
    const updated = [...checkoutPayments];
    if (field === 'amount') {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value;
    }
    setCheckoutPayments(updated);
  };

  const handleCompleteSale = async () => {
    // Verify payments covers total
    const totalPaid = checkoutPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // If Cash is the only payment method, allow tendered amount to exceed total (for change calculation)
    const isSingleCash = checkoutPayments.length === 1 && checkoutPayments[0].method.toLowerCase() === 'cash';

    if (!isSingleCash && totalPaid < totals.total) {
      toast.error('Total payment amount does not cover order total');
      return;
    }

    try {
      const orderItems = cartItems.map((item) => ({
        product_id: item.product._id,
        name: item.product.name,
        variant_name: item.variantName,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        tax_rate_id: item.taxRate?._id || null,
        tax_percentage: item.taxRate ? Number(item.taxRate.percentage) : 0,
        tax_amount: item.taxRate
          ? Number(((item.price * item.quantity) * (Number(item.taxRate.percentage) / 100)).toFixed(2))
          : 0,
      }));

      // Adjust cash payment item if tendered is higher
      const finalPayments = checkoutPayments.map((p) => {
        if (p.method.toLowerCase() === 'cash' && Number(cashTendered) > p.amount) {
          return { method: p.method, amount: p.amount }; // record exact order amount paid in cash
        }
        return p;
      });

      const orderPayload = {
        customer_id: customer?._id || null,
        items: orderItems,
        discounts: orderDiscount
          ? [
              {
                name: orderDiscount.name,
                type: orderDiscount.type,
                value: orderDiscount.default_value,
                amount: totals.discountAmount,
              },
            ]
          : [],
        taxes: totals.taxes,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        tax_amount: totals.taxAmount,
        total: totals.total,
        payments: finalPayments,
        redeemedPoints: redeemedPoints,
      };

      const response = await apiClient.post('/api/orders', orderPayload);
      setLastCreatedOrder(response.data);
      
      // Trigger Supabase Realtime broadcast for manager alerts
      try {
        const channel = supabase.channel(`outlet:${user.outlet_id._id}:orders`);
        channel.send({
          type: 'broadcast',
          event: 'new_order',
          payload: { orderId: response.data._id, total: response.data.total },
        });
      } catch (rtErr) {
        console.error('Realtime broadcast failed:', rtErr);
      }

      // Check for low stock alerts on checkout items and broadcast alerts if needed
      for (const item of response.data.items) {
        // Find local product to inspect stock
        const prod = products.find((p) => p._id === item.product_id);
        if (prod && (prod.stock - item.quantity) <= prod.stock_threshold) {
          try {
            const alertChannel = supabase.channel(`outlet:${user.outlet_id._id}:alerts`);
            alertChannel.send({
              type: 'broadcast',
              event: 'low_stock',
              payload: { productName: prod.name, stockRemaining: prod.stock - item.quantity },
            });
          } catch (rtErr) {
            console.error('Realtime alert broadcast failed:', rtErr);
          }
        }
      }

      toast.success('Sale completed successfully!');
      clearCart();
      setIsCheckoutModalOpen(false);
      setIsReceiptModalOpen(true);
      
      // Reload products to get latest stock levels
      const prodsRes = await apiClient.get('/api/products');
      setProducts(prodsRes.data);

    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error processing transaction');
    }
  };

  // Calculate change for Cash tendered
  const allocatedCashPayment = checkoutPayments.find((p) => p.method.toLowerCase() === 'cash')?.amount || 0;
  const cashChange = Math.max(0, Number(cashTendered) - allocatedCashPayment);

  // Render POS
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Shift Block Overlay */}
      {!isShiftValid && (
        <div className="absolute inset-0 z-40 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-950/40 text-rose-500 border border-rose-900/40 rounded-2xl flex items-center justify-center mb-6">
            <Square className="w-8 h-8 fill-current" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Shift is Closed</h2>
          <p className="text-sm font-semibold text-slate-400 mt-2 max-w-sm">
            Drawer shift is locked. You must Clock In and record the opening cash balance from the topbar button before completing any sales.
          </p>
        </div>
      )}

      {/* Left Panel: Catalog list */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Category filtering chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 shrink-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 h-10 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-650/10'
                : 'bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-650 dark:text-slate-300'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-4 h-10 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center cursor-pointer ${
                selectedCategory === cat._id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-650/10'
                  : 'bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-650 dark:text-slate-350'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full mr-2 inline-block shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search tool */}
        <div className="relative mb-6 shrink-0">
          <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU code, or scan barcode..."
            className="w-full h-11 pl-11 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                return (
                  <div
                    key={p._id}
                    onClick={() => handleProductCardClick(p)}
                    className={`relative p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] group select-none ${
                      isOutOfStock ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Item category chip label */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: p.category_id?.color || '#4F46E5' }}
                      >
                        {p.category_id?.name || 'Item'}
                      </span>
                    </div>

                    {/* Stock level preview */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        p.stock <= p.stock_threshold
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        Stock: {p.stock}
                      </span>
                    </div>

                    <div className="pt-8">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {p.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{p.sku}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                        ₹{p.base_price.toFixed(2)}
                      </span>
                      {isOutOfStock && (
                        <span className="text-xs font-black text-rose-600">OUT OF STOCK</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl">
              <Folder className="w-10 h-10 text-slate-350 mb-3" />
              <p className="text-sm text-slate-400 font-semibold">No products found matching filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Shopping Cart */}
      <div className="w-96 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col h-full z-10">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center">
            Shopping Basket
            <span className="ml-2 w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </h3>
          <div className="space-x-1.5">
            {heldOrders.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => setIsRecallModalOpen(true)}
                className="!h-8 !px-2.5 rounded-lg text-xs"
              >
                Recall ({heldOrders.length})
              </Button>
            )}
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-slate-450 hover:text-rose-600 transition-colors p-1"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Customer Attachment Row */}
        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          {customer ? (
            <div className="flex items-center justify-between w-full">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{customer.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{customer.phone} • pts: {customer.loyalty_points}</p>
              </div>
              <button
                onClick={() => setCustomer(null)}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setCustomerSearch('');
                setIsCustomerModalOpen(true);
              }}
              className="w-full flex items-center justify-center py-2 border border-dashed border-slate-200 dark:border-slate-800 text-slate-450 hover:text-indigo-650 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100/50 text-xs font-bold cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Add Customer to Sale
            </button>
          )}
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100/60 dark:border-slate-900"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-250 truncate">
                    {item.product.name}
                  </p>
                  {item.variantName && (
                    <p className="text-[10px] text-indigo-500 font-bold">{item.variantName}</p>
                  )}
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Qty adjustments */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variantName)}
                    className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 w-6 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variantName)}
                    className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product._id, item.variantName)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-650 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <FolderHeart className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-xs text-slate-405 font-bold">Shopping cart is empty</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click products on the left to add items</p>
            </div>
          )}
        </div>

        {/* Cart Totals Summary */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 shrink-0">
          <div className="flex justify-between text-xs text-slate-500 font-semibold">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toFixed(2)}</span>
          </div>

          {/* Discount Trigger */}
          <div className="flex justify-between text-xs text-slate-500 font-semibold items-center">
            <button
              onClick={() => setIsDiscountModalOpen(true)}
              className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5 mr-1" />
              {orderDiscount ? `Discount (${orderDiscount.name})` : 'Apply Discount'}
            </button>
            {totals.discountAmount > 0 ? (
              <span className="text-rose-500 font-bold">-₹{totals.discountAmount.toFixed(2)}</span>
            ) : (
              <span>₹0.00</span>
            )}
          </div>

          {/* Taxes summary */}
          {totals.taxes.map((tax, idx) => (
            <div key={idx} className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>{tax.name}</span>
              <span>₹{tax.amount.toFixed(2)}</span>
            </div>
          ))}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Total Payable</span>
            <span className="text-xl font-black text-slate-900 dark:text-slate-50">
              ₹{totals.total.toFixed(2)}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="secondary"
              onClick={holdOrder}
              disabled={cartItems.length === 0}
              className="flex-1 rounded-xl !h-10 text-xs"
            >
              Hold Sale
            </Button>
            <Button
              variant="success"
              onClick={openCheckout}
              disabled={cartItems.length === 0 || !isShiftValid}
              className="flex-2 rounded-xl !h-10 text-xs font-bold"
            >
              Complete Sale
            </Button>
          </div>
        </div>
      </div>

      {/* Select Product Variant Modal */}
      {isVariantModalOpen && activeProductForVariants && (
        <Modal
          title={`Choose Variant for ${activeProductForVariants.name}`}
          onClose={() => setIsVariantModalOpen(false)}
          size="sm"
        >
          <div className="space-y-3">
            {activeProductForVariants.variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => {
                  addToCart(activeProductForVariants, v);
                  setIsVariantModalOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-indigo-50/20 hover:border-indigo-550 transition-all text-left text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <span>{v.name}</span>
                <span className="text-indigo-600">₹{v.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Recall Held Orders Modal */}
      {isRecallModalOpen && (
        <Modal
          title="Recall Saved Held Orders"
          onClose={() => setIsRecallModalOpen(false)}
          size="md"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {heldOrders.length > 0 ? (
              heldOrders.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-4 border border-slate-105 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {h.customer ? h.customer.name : 'Walk-in Customer'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {h.cartItems.length} items • {new Date(h.time).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        recallOrder(h.id);
                        setIsRecallModalOpen(false);
                      }}
                      className="!h-8 rounded-lg text-xs"
                    >
                      Recall
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => removeHeldOrder(h.id)}
                      className="!h-8 !px-3 rounded-lg text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-sm text-slate-400 font-semibold">No held orders available</p>
            )}
          </div>
        </Modal>
      )}

      {/* Customer Attach / Quick Create Modal */}
      {isCustomerModalOpen && (
        <Modal
          title="Attach Customer"
          onClose={() => setIsCustomerModalOpen(false)}
          size="md"
        >
          <div className="space-y-6">
            {/* Search list */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase mb-2 block">
                Find Existing Customer
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by customer name or phone number..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="mt-3 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 pr-1">
                {customers
                  .filter(
                    (c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                      c.phone.includes(customerSearch)
                  )
                  .map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        setCustomer(c);
                        setIsCustomerModalOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-indigo-50/20 hover:text-indigo-650 transition-colors cursor-pointer"
                    >
                      <span>{c.name} ({c.phone})</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                        pts: {c.loyalty_points}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800 relative">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 uppercase">
                Or Quick Create
              </span>
            </div>

            {/* Quick Create Form */}
            <form onSubmit={handleQuickCustomerCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Full Name" required>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </FormField>
                <FormField label="Phone Number" required>
                  <input
                    type="text"
                    required
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="9998887776"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </FormField>
              </div>
              <FormField label="Email (Optional)">
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </FormField>

              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="secondary" onClick={() => setIsCustomerModalOpen(false)}>
                  Close
                </Button>
                <Button type="submit" variant="primary">
                  Save & Attach
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Apply Order-level Discount Modal */}
      {isDiscountModalOpen && (
        <Modal
          title="Apply Order Discount"
          onClose={() => setIsDiscountModalOpen(false)}
          size="sm"
        >
          <div className="space-y-3">
            {/* Clear option */}
            <button
              onClick={() => {
                setDiscount(null);
                setIsDiscountModalOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 border border-dashed border-rose-200 dark:border-rose-900 text-rose-500 rounded-xl hover:bg-rose-50/20 transition-all text-sm font-bold cursor-pointer"
            >
              Remove Active Discount
            </button>
            {discountTypes.map((d) => (
              <button
                key={d._id}
                onClick={() => {
                  setDiscount(d);
                  setIsDiscountModalOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 border rounded-xl hover:bg-indigo-50/20 hover:border-indigo-550 transition-all text-left text-sm font-bold cursor-pointer ${
                  orderDiscount?._id === d._id
                    ? 'border-indigo-650 bg-indigo-50/10 text-indigo-650'
                    : 'border-slate-105 dark:border-slate-800 text-slate-700 dark:text-slate-205'
                }`}
              >
                <div>
                  <p>{d.name}</p>
                  {d.requires_approval && (
                    <span className="text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                      Manager Approval Required
                    </span>
                  )}
                </div>
                <span>
                  {d.type === 'percentage' ? `${d.default_value}%` : `₹${d.default_value}`}
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Checkout and Payment Confirmation Modal */}
      {isCheckoutModalOpen && (
        <Modal
          title="Complete Checkout Payment"
          onClose={() => setIsCheckoutModalOpen(false)}
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Summary */}
            <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250 border-b pb-2 mb-2">Order Summary</h4>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-500">
                    <span>Discount</span>
                    <span className="font-bold">-₹{totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {totals.taxes.map((t, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{t.name}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">₹{t.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-50 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Due</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Loyalty Program Redemptions */}
              {customer && customer.loyalty_points > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center">
                    <Sparkles className="w-4 h-4 mr-1 text-indigo-500" />
                    Loyalty Reward Points
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Points available: {customer.loyalty_points} (Value: ₹{(customer.loyalty_points * loyaltyRules.redeem).toFixed(2)})
                  </p>
                  
                  {redeemedPoints === 0 ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const val = Math.min(totals.total, customer.loyalty_points * loyaltyRules.redeem);
                        const points = Math.floor(val / loyaltyRules.redeem);
                        setRedeemedPoints(points);
                        // Adjust checkout payments total
                        const updated = [...checkoutPayments];
                        updated[0].amount = Math.max(0, totals.total - val);
                        setCheckoutPayments(updated);
                        toast.success(`Redeemed ${points} points for ₹${val.toFixed(2)} discount`);
                      }}
                      className="!h-9 text-xs rounded-xl w-full"
                    >
                      Redeem Available Points
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-indigo-50/30 rounded-xl text-xs font-bold text-indigo-650 border border-indigo-100">
                      <span>Redeemed {redeemedPoints} pts (-₹{(redeemedPoints * loyaltyRules.redeem).toFixed(2)})</span>
                      <button
                        onClick={() => {
                          setRedeemedPoints(0);
                          const updated = [...checkoutPayments];
                          updated[0].amount = totals.total;
                          setCheckoutPayments(updated);
                        }}
                        className="text-rose-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payments input details */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250">Payment Split Settings</h4>
              <div className="space-y-3">
                {checkoutPayments.map((p, idx) => (
                  <div key={idx} className="flex items-end space-x-2">
                    <FormField label="Method" className="flex-1">
                      <select
                        value={p.method}
                        onChange={(e) => handlePaymentMethodChange(idx, 'method', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {paymentMethods.map((m) => (
                          <option key={m._id} value={m.name}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Amount (₹)" className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.amount}
                        onChange={(e) => handlePaymentMethodChange(idx, 'amount', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-202 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </FormField>

                    {checkoutPayments.length > 1 && (
                      <button
                        onClick={() => removeSplitPayment(idx)}
                        className="h-11 px-2.5 rounded-xl text-rose-500 bg-rose-50 hover:bg-rose-100 flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Split button */}
              <button
                onClick={addSplitPayment}
                className="inline-flex items-center text-xs font-bold text-indigo-650 hover:text-indigo-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Split Payment Method
              </button>

              {/* Cash Change Drawer calculation */}
              {checkoutPayments.some((p) => p.method.toLowerCase() === 'cash') && (
                <div className="pt-2">
                  <FormField label="Cash Amount Tendered (₹)" required>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </FormField>
                  
                  {Number(cashTendered) > allocatedCashPayment && (
                    <div className="mt-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 font-bold text-xs flex justify-between items-center">
                      <span>Change to Return</span>
                      <span className="text-sm font-black">₹{cashChange.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCompleteSale}
                  className="flex-1 font-bold"
                >
                  Confirm Payment
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable Receipt Modal */}
      {isReceiptModalOpen && lastCreatedOrder && (
        <Modal
          title="Checkout Completed - Customer Receipt"
          onClose={() => {
            setIsReceiptModalOpen(false);
            setLastCreatedOrder(null);
          }}
          size="sm"
        >
          {/* HTML Printable Area */}
          <div id="receipt-print-area" className="p-4 bg-white text-slate-900 border rounded-2xl text-xs font-mono max-w-[320px] mx-auto space-y-4">
            <div className="text-center">
              <h3 className="text-sm font-extrabold">{user.outlet_id?.name}</h3>
              {user.outlet_id?.address && <p className="text-[10px] mt-0.5">{user.outlet_id.address}</p>}
              {user.outlet_id?.tax_number && <p className="text-[10px]">Tax Registration: {user.outlet_id.tax_number}</p>}
              <p className="text-[9px] text-slate-400 mt-1">Receipt ID: {lastCreatedOrder._id.toUpperCase()}</p>
              <p className="text-[9px] text-slate-400">Date: {new Date(lastCreatedOrder.createdAt).toLocaleString()}</p>
            </div>

            <div className="border-t border-dashed py-2 space-y-1">
              {lastCreatedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.name} {item.variant_name ? `(${item.variant_name})` : ''} x{item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{lastCreatedOrder.subtotal.toFixed(2)}</span>
              </div>
              {lastCreatedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-₹{lastCreatedOrder.discount_amount.toFixed(2)}</span>
                </div>
              )}
              {lastCreatedOrder.taxes.map((t, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{t.name}:</span>
                  <span>₹{t.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-black text-sm pt-1.5 border-t border-dashed">
                <span>Total Amount:</span>
                <span>₹{lastCreatedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed pt-2 space-y-1">
              <p className="font-bold text-[10px]">Payment Summary:</p>
              {lastCreatedOrder.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{p.method}:</span>
                  <span>₹{p.amount.toFixed(2)}</span>
                </div>
              ))}
              {lastCreatedOrder.customer_id && (
                <div className="pt-2 border-t border-dashed border-slate-100 text-[9px] text-slate-400 text-center">
                  <span>Customer: {lastCreatedOrder.customer_id.name}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-dashed text-[10px] text-slate-400">
              <p>Thank you for shopping with us!</p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setIsReceiptModalOpen(false);
                setLastCreatedOrder(null);
              }}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => {
                const w = window.open();
                const content = document.getElementById('receipt-print-area').innerHTML;
                w.document.write(`
                  <html>
                    <head><title>Print Receipt</title></head>
                    <body style="font-family: monospace; padding: 20px;" onload="window.print(); window.close();">
                      ${content}
                    </body>
                  </html>
                `);
                w.document.close();
              }}
              className="flex-1"
            >
              Print Receipt
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
