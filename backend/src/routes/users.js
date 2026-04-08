const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET   /api/users/me
router.get('/me', ctrl.getProfile);

// PATCH /api/users/push-token
router.patch(
  '/push-token',
  body('token').isString().notEmpty(),
  ctrl.updatePushToken
);

// PUT   /api/users/password
router.put(
  '/password',
  body('currentPassword').isString().notEmpty(),
  body('newPassword').isString().isLength({ min: 8 }),
  ctrl.changePassword
);

// DELETE /api/users/me
router.delete('/me', ctrl.deleteAccount);

// PATCH  /api/users/settings
router.patch(
  '/settings',
  body('defaultThresholdPercent').optional().isInt({ min: 1, max: 99 }),
  body('emailNotificationsEnabled').optional().isBoolean(),
  body('notificationEmail').optional().isEmail(),
  ctrl.updateSettings
);

// POST  /api/users/poll-trigger  (dev/test only)
router.post('/poll-trigger', ctrl.triggerPoll);

module.exports = router;
