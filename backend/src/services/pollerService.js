/**
 * Background price poller.
 *
 * Product poll:  every POLL_INTERVAL_HOURS (default 2h)
 * Category poll: every CATEGORY_POLL_INTERVAL_HOURS (default 12h)
 */

const cron = require('node-cron');
const { query, getClient } = require('../config/database');
const { getItemsByASIN, searchProducts } = require('./amazonService');
const { sendPriceDropAlert } = require('./notificationService');
const CategoryWatch = require('../models/CategoryWatch');
const logger = require('../config/logger');

const INTERVAL_HOURS = Math.min(6, Math.max(1, Number(process.env.POLL_INTERVAL_HOURS) || 2));
const BATCH_SIZE = Math.min(10, Number(process.env.POLL_BATCH_SIZE) || 10);
const CATEGORY_INTERVAL_HOURS = Math.min(24, Math.max(1, Number(process.env.CATEGORY_POLL_INTERVAL_HOURS) || 12));

const CATEGORY_SEARCH_TERMS = {
  electronics: 'electronics deals',
  clothing:    'clothing fashion deals',
  sports:      'sports outdoor equipment',
  home:        'home kitchen essentials',
  books:       'bestselling books',
  toys:        'toys games kids',
  beauty:      'beauty skincare',
};

// ─── Product polling ──────────────────────────────────────────────────────────

async function pollPrices() {
  logger.info('[poller] Starting price poll run');
  const start = Date.now();

  const { rows: products } = await query(`
    SELECT p.id, p.asin, p.title, p.current_price
    FROM products p
    INNER JOIN tracked_products tp ON tp.product_id = p.id
    WHERE tp.notify_enabled = TRUE
    GROUP BY p.id
    ORDER BY MIN(p.last_checked_at) ASC NULLS FIRST
  `);

  if (products.length === 0) {
    logger.info('[poller] No tracked products — skipping');
    return;
  }

  logger.info(`[poller] Polling ${products.length} product(s) in batches of ${BATCH_SIZE}`);

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const asinMap = Object.fromEntries(batch.map((p) => [p.asin, p]));
    const asins = Object.keys(asinMap);

    let freshItems;
    try {
      freshItems = await getItemsByASIN(asins);
    } catch (err) {
      logger.error(`[poller] Batch failed (ASINs: ${asins.join(',')}):`, err);
      continue;
    }

    for (const item of freshItems) {
      const product = asinMap[item.asin];
      if (!product) continue;

      const newPrice = item.current_price;
      if (newPrice === null) continue;

      const client = await getClient();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO price_history (product_id, price, currency) VALUES ($1, $2, $3)`,
          [product.id, newPrice, item.currency]
        );
        await client.query(
          `UPDATE products
           SET current_price = $1, currency = $2, availability = $3,
               title = $4, image_url = $5, last_checked_at = NOW()
           WHERE id = $6`,
          [newPrice, item.currency, item.availability, item.title, item.image_url, product.id]
        );
        await client.query('COMMIT');
      } catch (dbErr) {
        await client.query('ROLLBACK');
        logger.error(`[poller] DB error for ASIN ${item.asin}:`, dbErr);
        client.release();
        continue;
      }
      client.release();

      const oldPrice = parseFloat(product.current_price);
      if (!oldPrice || oldPrice <= 0 || newPrice >= oldPrice) continue;

      const dropPercent = ((oldPrice - newPrice) / oldPrice) * 100;

      const { rows: subscribers } = await query(
        `SELECT tp.threshold_percent, tp.target_price,
                u.id AS user_id, u.expo_push_token, u.display_name
         FROM tracked_products tp
         INNER JOIN users u ON u.id = tp.user_id
         WHERE tp.product_id = $1
           AND tp.notify_enabled = TRUE
           AND u.is_active = TRUE`,
        [product.id]
      );

      for (const sub of subscribers) {
        const thresholdMet = dropPercent >= parseFloat(sub.threshold_percent);
        const targetMet = sub.target_price !== null && newPrice <= parseFloat(sub.target_price);
        if (!thresholdMet && !targetMet) continue;

        await query(
          `INSERT INTO alerts (user_id, product_id, old_price, new_price, drop_percent, message)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            sub.user_id, product.id, oldPrice, newPrice, dropPercent,
            `Price dropped ${dropPercent.toFixed(1)}% on "${item.title}"`,
          ]
        );

        await sendPriceDropAlert({
          pushToken: sub.expo_push_token,
          productTitle: item.title,
          oldPrice, newPrice, dropPercent, asin: item.asin,
        });

        logger.info(`[poller] Alert fired: ${item.asin} dropped ${dropPercent.toFixed(1)}% for user ${sub.user_id}`);
      }
    }
  }

  logger.info(`[poller] Poll run complete in ${Date.now() - start}ms`);
}

// ─── Category polling ─────────────────────────────────────────────────────────

async function pollCategories() {
  const activeCategories = await CategoryWatch.getAllActive();
  if (activeCategories.length === 0) return;

  logger.info(`[poller] Polling ${activeCategories.length} category watchlist(s)`);

  for (const { category_key, category_name, search_term } of activeCategories) {
    try {
      const searchTerm = search_term || CATEGORY_SEARCH_TERMS[category_key] || category_name;
      const items = await searchProducts(searchTerm, { itemCount: 20 });

      for (const item of items) {
        if (!item.asin || item.current_price === null) continue;
        const newPrice = parseFloat(item.current_price);

        // Get cached price for this item in this category
        const { rows: cached } = await query(
          'SELECT last_price FROM category_price_cache WHERE asin = $1 AND category_key = $2',
          [item.asin, category_key]
        );

        // Upsert cache entry with latest price
        await query(
          `INSERT INTO category_price_cache
             (asin, category_key, title, image_url, product_url, last_price, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (asin, category_key) DO UPDATE SET
             last_price = $6, title = $3, image_url = $4, last_seen_at = NOW()`,
          [item.asin, category_key, item.title, item.image_url, item.product_url, newPrice, item.currency || 'USD']
        );

        if (cached.length === 0) continue; // First time — establish baseline, no alert yet

        const oldPrice = parseFloat(cached[0].last_price);
        if (!oldPrice || oldPrice <= 0 || newPrice >= oldPrice) continue;

        const dropPercent = ((oldPrice - newPrice) / oldPrice) * 100;

        // Find watchers whose threshold is met
        const { rows: watchers } = await query(
          `SELECT cw.threshold_percent,
                  u.id AS user_id, u.expo_push_token
           FROM category_watches cw
           INNER JOIN users u ON u.id = cw.user_id
           WHERE cw.category_key = $1
             AND cw.notify_enabled = TRUE
             AND u.is_active = TRUE
             AND $2 >= cw.threshold_percent`,
          [category_key, dropPercent]
        );

        for (const watcher of watchers) {
          // Deduplicate: skip if we already alerted this user about this ASIN in the last 24h
          const { rows: recent } = await query(
            `SELECT 1 FROM alerts
             WHERE user_id = $1 AND asin = $2
               AND sent_at > NOW() - INTERVAL '24 hours'`,
            [watcher.user_id, item.asin]
          );
          if (recent.length > 0) continue;

          await query(
            `INSERT INTO alerts
               (user_id, old_price, new_price, drop_percent, message,
                category_key, asin, title, image_url, product_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              watcher.user_id, oldPrice, newPrice, dropPercent,
              `Price dropped ${dropPercent.toFixed(1)}% on "${item.title}" (${category_name})`,
              category_key, item.asin, item.title, item.image_url, item.product_url,
            ]
          );

          await sendPriceDropAlert({
            pushToken: watcher.expo_push_token,
            productTitle: item.title,
            oldPrice, newPrice, dropPercent, asin: item.asin,
          });

          logger.info(`[poller] Category alert: ${item.asin} dropped ${dropPercent.toFixed(1)}% for user ${watcher.user_id}`);
        }
      }
    } catch (err) {
      logger.error(`[poller] Category poll failed for "${category_key}":`, err);
    }
  }
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

function buildCron(hours) {
  return `0 */${hours} * * *`;
}

let productTask = null;
let categoryTask = null;

function start() {
  const productExpr  = buildCron(INTERVAL_HOURS);
  const categoryExpr = buildCron(CATEGORY_INTERVAL_HOURS);

  logger.info(`[poller] Product polls: "${productExpr}" (every ${INTERVAL_HOURS}h)`);
  logger.info(`[poller] Category polls: "${categoryExpr}" (every ${CATEGORY_INTERVAL_HOURS}h)`);

  productTask = cron.schedule(productExpr, () => {
    pollPrices().catch((err) => logger.error('[poller] Product poll error:', err));
  });

  categoryTask = cron.schedule(categoryExpr, () => {
    pollCategories().catch((err) => logger.error('[poller] Category poll error:', err));
  });

  setImmediate(() => {
    pollPrices().catch((err) => logger.error('[poller] Initial product poll error:', err));
    pollCategories().catch((err) => logger.error('[poller] Initial category poll error:', err));
  });
}

function stop() {
  if (productTask)  { productTask.stop();  }
  if (categoryTask) { categoryTask.stop(); }
  logger.info('[poller] Stopped');
}

module.exports = { start, stop, pollPrices, pollCategories };
