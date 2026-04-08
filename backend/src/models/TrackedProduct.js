const { query } = require('../config/database');

async function track({ userId, productId, thresholdPercent = 10, targetPrice = null }) {
  const { rows } = await query(
    `INSERT INTO tracked_products (user_id, product_id, threshold_percent, target_price)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, product_id) DO UPDATE SET
       threshold_percent = EXCLUDED.threshold_percent,
       target_price      = EXCLUDED.target_price,
       notify_enabled    = TRUE
     RETURNING *`,
    [userId, productId, thresholdPercent, targetPrice]
  );
  return rows[0];
}

async function untrack(userId, productId) {
  const { rowCount } = await query(
    'DELETE FROM tracked_products WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return rowCount > 0;
}

async function update(userId, productId, { thresholdPercent, targetPrice, notifyEnabled }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (thresholdPercent !== undefined) { fields.push(`threshold_percent = $${idx++}`); values.push(thresholdPercent); }
  if (targetPrice !== undefined)      { fields.push(`target_price = $${idx++}`);      values.push(targetPrice); }
  if (notifyEnabled !== undefined)    { fields.push(`notify_enabled = $${idx++}`);    values.push(notifyEnabled); }

  if (fields.length === 0) throw new Error('No fields to update');

  values.push(userId, productId);
  const { rows } = await query(
    `UPDATE tracked_products SET ${fields.join(', ')}
     WHERE user_id = $${idx} AND product_id = $${idx + 1}
     RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function find(userId, productId) {
  const { rows } = await query(
    'SELECT * FROM tracked_products WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return rows[0] || null;
}

module.exports = { track, untrack, update, find };
