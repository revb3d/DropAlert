const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/productController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET  /api/products          — list user's tracked products
router.get('/', ctrl.listTracked);

// GET  /api/products/search?q — search Amazon
router.get('/search', ctrl.searchAmazon);

// POST /api/products/track    — start tracking by ASIN
router.post(
  '/track',
  [
    body('asin')
      .isString()
      .trim()
      .toUpperCase()
      .matches(/^[A-Z0-9]{10}$/)
      .withMessage('Invalid ASIN format'),
    body('thresholdPercent')
      .optional()
      .isFloat({ min: 1, max: 99 })
      .withMessage('Threshold must be between 1 and 99'),
    body('targetPrice')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('Target price must be a positive number'),
  ],
  ctrl.trackProduct
);

// DELETE /api/products/:productId/track
router.delete(
  '/:productId/track',
  param('productId').isUUID(),
  ctrl.untrackProduct
);

// PATCH /api/products/:productId/settings
router.patch(
  '/:productId/settings',
  [
    param('productId').isUUID(),
    body('thresholdPercent').optional().isFloat({ min: 1, max: 99 }),
    body('targetPrice').optional({ nullable: true }).isFloat({ min: 0 }),
    body('notifyEnabled').optional().isBoolean(),
  ],
  ctrl.updateSettings
);

// GET /api/products/:productId/history
router.get('/:productId/history', param('productId').isUUID(), ctrl.getPriceHistory);

module.exports = router;
