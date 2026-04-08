const router = require('express').Router();
const { param } = require('express-validator');
const ctrl = require('../controllers/alertController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET  /api/alerts             — paginated alert feed
router.get('/', ctrl.listAlerts);

// PATCH /api/alerts/read-all   — mark all as read
router.patch('/read-all', ctrl.markAllRead);

// PATCH /api/alerts/:alertId/read
router.patch('/:alertId/read', param('alertId').isUUID(), ctrl.markRead);

module.exports = router;
