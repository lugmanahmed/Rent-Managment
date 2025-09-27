const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const tenantRoutes = require('./routes/tenants');
const paymentRoutes = require('./routes/payments');
const assetRoutes = require('./routes/assets');
const maintenanceRoutes = require('./routes/maintenance');
const reportRoutes = require('./routes/reports');
const companyRoutes = require('./routes/companies');
const rentalUnitRoutes = require('./routes/rental-units');
const settingsRoutes = require('./routes/settings');
const invoiceRoutes = require('./routes/invoices');
const paymentTypeRoutes = require('./routes/payment-types');
const currencyRoutes = require('./routes/currencies');
const paymentModeRoutes = require('./routes/payment-modes');
const paymentRecordRoutes = require('./routes/payment-records');
const roleRoutes = require('./routes/roles');
const userRoutes = require('./routes/users');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes except auth in development
if (process.env.NODE_ENV === 'production') {
  app.use(limiter);
} else {
  // In development, apply less restrictive rate limiting
  const devLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute in development
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(devLimiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rent-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('⚠️  Running without database - some features may not work');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/rental-units', rentalUnitRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payment-types', paymentTypeRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/payment-modes', paymentModeRoutes);
app.use('/api/payment-records', paymentRecordRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start cron jobs
const cronService = require('./services/cronService');
cronService.startRentGenerationJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
