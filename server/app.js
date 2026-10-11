const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { getSessionMiddleware } = require('./config/session');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const createApp = () => {
  const app = express();

  // Render/Heroku run behind a reverse proxy. Trusting the first proxy hop
  // lets express-session detect the original HTTPS protocol so that secure
  // cross-site cookies are emitted correctly in production.
  app.set('trust proxy', 1);

  // Helmet with relaxed cross-origin resource policy for serving uploaded images
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const isProduction = process.env.NODE_ENV === 'production';

  // CORS configuration. CLIENT_URL may be a comma-separated list of allowed
  // frontend origins (e.g. Vercel production + preview deployments).
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : []),
  ]
    .map((origin) => origin && origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server).
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Restrict unknown origins in production; keep dev convenience locally.
        if (isProduction) {
          return callback(null, false);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for uploaded images
  const uploadsPath = path.join(__dirname, 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Session middleware
  app.use(getSessionMiddleware());

  // API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/suppliers', supplierRoutes);
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/products', productRoutes);
  app.use('/api/v1', inventoryRoutes);
  app.use('/api/v1/orders', orderRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/uploads', uploadRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Production SPA fallback for URL rewriting
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/uploads/')) {
      return next();
    }
    const indexPath = path.join(clientDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  });

  // 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = { createApp };
