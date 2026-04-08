const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error:', err);
});

async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    logger.info('PostgreSQL connected');
  } finally {
    client.release();
  }
}

// Helper: run a query from the pool
function query(text, params) {
  return pool.query(text, params);
}

// Helper: get a dedicated client for transactions
function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient, testConnection };
