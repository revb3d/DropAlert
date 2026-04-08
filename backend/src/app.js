const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & compression
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Global rate limiter (100 req / 15 min per IP)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// Dev-only endpoints for testing
if (process.env.NODE_ENV !== 'production') {
  const { pollCategories } = require('./services/pollerService');
  const { query } = require('./config/database');

  // Trigger a real category poll
  app.post('/dev/trigger-category-poll', async (_req, res) => {
    try {
      await pollCategories();
      res.json({ ok: true, message: 'Category poll complete — check Alerts tab' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Inflate cached prices by 50% so next poll detects a "drop"
  app.post('/dev/fake-price-drop', async (_req, res) => {
    try {
      const { rowCount } = await query(
        `UPDATE category_price_cache SET last_price = last_price * 1.5 WHERE last_price IS NOT NULL`
      );
      res.json({ ok: true, message: `Inflated prices for ${rowCount} cached item(s). Now trigger the poll to fire alerts.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// 404
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use(errorHandler);

module.exports = app;
