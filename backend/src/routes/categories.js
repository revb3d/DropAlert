const router = require('express').Router();
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const {
  listWatches,
  createWatch,
  deleteWatch,
  updateWatch,
} = require('../controllers/categoryController');

router.use(requireAuth);

router.get('/', listWatches);

router.post(
  '/',
  body('watchType').optional().isIn(['category', 'keyword']),
  body('categoryKey').optional().isString().trim(),
  body('keyword').optional().isString().trim(),
  body('thresholdPercent').optional().isFloat({ min: 1, max: 99 }),
  createWatch
);

router.delete('/:id', deleteWatch);

router.patch(
  '/:id',
  body('thresholdPercent').optional().isFloat({ min: 1, max: 99 }),
  body('notifyEnabled').optional().isBoolean(),
  updateWatch
);

module.exports = router;
