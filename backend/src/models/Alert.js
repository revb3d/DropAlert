const { query } = require('../config/database');

async function getByUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const offset = (page - 1) * limit;
  const unreadFilter = unreadOnly ? 'AND a.is_read = FALSE' : '';

  const { rows } = await query(
    `SELECT a.*,
            COALESCE(a.title, p.title) AS product_title,
            COALESCE(a.asin,  p.asin)  AS product_asin,
            COALESCE(a.image_url, p.image_url) AS product_image_url
     FROM alerts a
     LEFT JOIN products p ON p.id = a.product_id
     WHERE a.user_id = $1 ${unreadFilter}
     ORDER BY a.sent_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

async function getUnreadCount(userId) {
  const { rows } = await query(
    'SELECT COUNT(*) AS count FROM alerts WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return parseInt(rows[0].count, 10);
}

async function markRead(userId, alertId) {
  const { rowCount } = await query(
    'UPDATE alerts SET is_read = TRUE WHERE id = $1 AND user_id = $2',
    [alertId, userId]
  );
  return rowCount > 0;
}

async function markAllRead(userId) {
  await query('UPDATE alerts SET is_read = TRUE WHERE user_id = $1', [userId]);
}

module.exports = { getByUser, getUnreadCount, markRead, markAllRead };
