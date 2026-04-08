const { query } = require('../config/database');

/**
 * Upsert a product by ASIN. Returns the product row.
 */
async function upsert({ asin, title, brand, image_url, product_url, current_price, currency, availability }) {
  const imageUrl = image_url; const productUrl = product_url; const currentPrice = current_price;
  const { rows } = await query(
    `INSERT INTO products (asin, title, brand, image_url, product_url, current_price, currency, availability)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (asin) DO UPDATE SET
       title         = EXCLUDED.title,
       brand         = EXCLUDED.brand,
       image_url     = EXCLUDED.image_url,
       product_url   = EXCLUDED.product_url,
       current_price = EXCLUDED.current_price,
       currency      = EXCLUDED.currency,
       availability  = EXCLUDED.availability,
       last_checked_at = NOW()
     RETURNING *`,
    [asin, title, brand, imageUrl, productUrl, currentPrice, currency, availability]
  );
  return rows[0];
}

async function findByASIN(asin) {
  const { rows } = await query('SELECT * FROM products WHERE asin = $1', [asin]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query('SELECT * FROM products WHERE id = $1', [id]);
  return rows[0] || null;
}

/**
 * Get all products tracked by a user, with their subscription metadata.
 */
async function getTrackedByUser(userId) {
  const { rows } = await query(
    `SELECT p.*, tp.threshold_percent, tp.target_price, tp.notify_enabled, tp.id AS tracked_id
     FROM products p
     INNER JOIN tracked_products tp ON tp.product_id = p.id
     WHERE tp.user_id = $1
     ORDER BY tp.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Get price history for sparkline (last N data points).
 */
async function getPriceHistory(productId, limit = 30) {
  const { rows } = await query(
    `SELECT price, currency, recorded_at
     FROM price_history
     WHERE product_id = $1
     ORDER BY recorded_at DESC
     LIMIT $2`,
    [productId, limit]
  );
  return rows.reverse(); // chronological order for charts
}

module.exports = { upsert, findByASIN, findById, getTrackedByUser, getPriceHistory };
