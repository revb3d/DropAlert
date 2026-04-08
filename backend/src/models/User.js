const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function create({ email, password, displayName }) {
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name, created_at`,
    [email.toLowerCase().trim(), hash, displayName || null]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await query(
    'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(
    'SELECT id, email, display_name, expo_push_token, created_at FROM users WHERE id = $1 AND is_active = TRUE',
    [id]
  );
  return rows[0] || null;
}

async function updatePushToken(userId, token) {
  await query('UPDATE users SET expo_push_token = $1 WHERE id = $2', [token, userId]);
}

async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

module.exports = { create, findByEmail, findById, updatePushToken, verifyPassword };
