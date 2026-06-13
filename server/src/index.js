require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./utils/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const outletRoutes = require('./routes/outletRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const taxRateRoutes = require('./routes/taxRateRoutes');
const discountTypeRoutes = require('./routes/discountTypeRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const stockAdjustmentReasonRoutes = require('./routes/stockAdjustmentReasonRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(helmet());
app.use(morgan('dev'));

// CORS setup
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiter to API routes
app.use('/api/', apiLimiter);

// Health check endpoint (for Render free tier ping)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tax-rates', taxRateRoutes);
app.use('/api/discount-types', discountTypeRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/stock-adjustment-reasons', stockAdjustmentReasonRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/reports', reportRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
