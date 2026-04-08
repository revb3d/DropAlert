const AlertModel = require('../models/Alert');

async function listAlerts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const unreadOnly = req.query.unread === 'true';

    const [alerts, unreadCount] = await Promise.all([
      AlertModel.getByUser(req.user.id, { page, limit, unreadOnly }),
      AlertModel.getUnreadCount(req.user.id),
    ]);

    res.json({ alerts, unreadCount, page, limit });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const updated = await AlertModel.markRead(req.user.id, req.params.alertId);
    if (!updated) return res.status(404).json({ error: 'Alert not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await AlertModel.markAllRead(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAlerts, markRead, markAllRead };
