const { query } = require('../config/database');

async function getByUser(userId) {
  const { rows } = await query(
    'SELECT * FROM category_watches WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return rows;
}

async function create(userId, categoryKey, categoryName, thresholdPercent, watchType = 'category', searchTerm = null) {
  const { rows } = await query(
    `INSERT INTO category_watches (user_id, category_key, category_name, threshold_percent, watch_type, search_term)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, category_key)
     DO UPDATE SET threshold_percent = $4, notify_enabled = TRUE, search_term = $6
     RETURNING *`,
    [userId, categoryKey, categoryName, thresholdPercent, watchType, searchTerm]
  );
  return rows[0];
}

async function remove(id, userId) {
  const { rowCount } = await query(
    'DELETE FROM category_watches WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
}

async function update(id, userId, fields) {
  const sets = [];
  const values = [];
  let i = 1;
  if (fields.thresholdPercent !== undefined) {
    sets.push(`threshold_percent = $${i++}`);
    values.push(fields.thresholdPercent);
  }
  if (fields.notifyEnabled !== undefined) {
    sets.push(`notify_enabled = $${i++}`);
    values.push(fields.notifyEnabled);
  }
  if (sets.length === 0) return null;
  values.push(id, userId);
  const { rows } = await query(
    `UPDATE category_watches SET ${sets.join(', ')} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
    values
  );
  return rows[0] || null;
}

// Returns distinct categories that have at least one active watcher
async function getAllActive() {
  const { rows } = await query(
    `SELECT DISTINCT category_key, category_name, search_term
     FROM category_watches
     WHERE notify_enabled = TRUE`
  );
  return rows;
}

module.exports = { getByUser, create, remove, update, getAllActive };
