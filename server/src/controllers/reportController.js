const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Shift = require('../models/Shift');

const getSalesReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {
    outlet_id: req.user.outlet_id,
    status: 'completed',
  };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  try {
    const orders = await Order.find(filter).populate('customer_id');

    // Calculate metrics
    let totalRevenue = 0;
    let totalCost = 0;
    const orderCount = orders.length;

    orders.forEach((order) => {
      totalRevenue += order.total;
      order.items.forEach((item) => {
        totalCost += (item.cost || 0) * item.quantity;
      });
    });

    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const grossProfit = totalRevenue - totalCost;

    // Daily breakdown for charts
    const dailyBreakdown = {};
    orders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (!dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr] = { date: dateStr, sales: 0, orders: 0 };
      }
      dailyBreakdown[dateStr].sales += order.total;
      dailyBreakdown[dateStr].orders += 1;
    });

    const chartData = Object.values(dailyBreakdown).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Top selling products
    const productSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const prodName = item.name + (item.variant_name ? ` (${item.variant_name})` : '');
        if (!productSales[prodName]) {
          productSales[prodName] = { name: prodName, quantity: 0, revenue: 0 };
        }
        productSales[prodName].quantity += item.quantity;
        productSales[prodName].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.status(200).json({
      metrics: {
        totalRevenue,
        orderCount,
        averageOrderValue,
        grossProfit,
      },
      chartData,
      topProducts,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling sales report', error: error.message });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find({ outlet_id: req.user.outlet_id });
    
    let totalItems = products.length;
    let lowStockCount = 0;
    let totalValuationCost = 0;
    let totalValuationRetail = 0;

    const items = await Promise.all(
      products.map(async (prod) => {
        const inv = await Inventory.findOne({ product_id: prod._id, outlet_id: req.user.outlet_id });
        const quantity = inv ? inv.quantity : 0;
        const isLow = quantity <= prod.stock_threshold;
        if (isLow) lowStockCount++;

        totalValuationCost += quantity * (prod.cost_price || 0);
        totalValuationRetail += quantity * prod.base_price;

        return {
          name: prod.name,
          sku: prod.sku,
          quantity,
          cost: prod.cost_price,
          price: prod.base_price,
          valuationCost: quantity * (prod.cost_price || 0),
          valuationRetail: quantity * prod.base_price,
          status: prod.status,
          isLowStock: isLow,
        };
      })
    );

    res.status(200).json({
      metrics: {
        totalItems,
        lowStockCount,
        totalValuationCost,
        totalValuationRetail,
      },
      items,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error compiling inventory report', error: error.message });
  }
};

module.exports = {
  getSalesReport,
  getInventoryReport,
};
