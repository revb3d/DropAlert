const { validationResult } = require('express-validator');
const ProductModel = require('../models/Product');
const TrackedProductModel = require('../models/TrackedProduct');
const { getItemsByASIN, searchProducts } = require('../services/amazonService');

/**
 * GET /api/products
 * List all products tracked by the authenticated user.
 */
async function listTracked(req, res, next) {
  try {
    const products = await ProductModel.getTrackedByUser(req.user.id);
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/products/track
 * Start tracking an Amazon product by ASIN.
 * Body: { asin, thresholdPercent?, targetPrice? }
 */
async function trackProduct(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { asin, thresholdPercent = 10, targetPrice = null } = req.body;

    // Fetch fresh data from Amazon
    let items;
    try {
      items = await getItemsByASIN([asin.toUpperCase()]);
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }

    if (!items.length) {
      return res.status(404).json({ error: 'Product not found on Amazon' });
    }

    const item = items[0];
    const product = await ProductModel.upsert(item);

    // Record initial price history entry if we got a price
    if (item.current_price !== null) {
      const { query } = require('../config/database');
      await query(
        'INSERT INTO price_history (product_id, price, currency) VALUES ($1,$2,$3)',
        [product.id, item.current_price, item.currency]
      );
    }

    const tracked = await TrackedProductModel.track({
      userId: req.user.id,
      productId: product.id,
      thresholdPercent,
      targetPrice,
    });

    res.status(201).json({ product: { ...product, ...tracked } });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/products/:productId/track
 * Stop tracking a product.
 */
async function untrackProduct(req, res, next) {
  try {
    const removed = await TrackedProductModel.untrack(req.user.id, req.params.productId);
    if (!removed) return res.status(404).json({ error: 'Not tracking this product' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/products/:productId/settings
 * Update threshold or target price for a tracked product.
 */
async function updateSettings(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { thresholdPercent, targetPrice, notifyEnabled } = req.body;
    const updated = await TrackedProductModel.update(req.user.id, req.params.productId, {
      thresholdPercent,
      targetPrice,
      notifyEnabled,
    });

    if (!updated) return res.status(404).json({ error: 'Tracked product not found' });
    res.json({ tracked: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:productId/history
 * Price history for sparkline (last 30 data points by default).
 */
async function getPriceHistory(req, res, next) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 30);
    const history = await ProductModel.getPriceHistory(req.params.productId, limit);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/search?q=...
 * Search Amazon products by keyword.
 */
async function searchAmazon(req, res, next) {
  try {
    const { q, searchIndex, page } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(422).json({ error: 'Query must be at least 2 characters' });
    }

    let results;
    try {
      results = await searchProducts(q.trim(), { searchIndex, page: parseInt(page) || 1 });
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }

    res.json({ results });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTracked, trackProduct, untrackProduct, updateSettings, getPriceHistory, searchAmazon };
