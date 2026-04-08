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

// POST  /api/users/poll-trigger  (dev/test only)
router.post('/poll-trigger', ctrl.triggerPoll);

module.exports = router;
