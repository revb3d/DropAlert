const { validationResult } = require('express-validator');
const UserModel = require('../models/User');
const { Expo } = require('expo-server-sdk');
const bcrypt = require('bcryptjs');

/**
 * PATCH /api/users/push-token
 * Register or update the user's Expo push token.
 */
async function updatePushToken(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { token } = req.body;
    if (!Expo.isExpoPushToken(token)) {
      return res.status(422).json({ error: 'Invalid Expo push token' });
    }

    await UserModel.updatePushToken(req.user.id, token);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/me
 * Return the authenticated user's profile.
 */
async function getProfile(req, res) {
  res.json({ user: req.user });
}

/**
 * POST /api/users/poll-trigger
 * Manually trigger a price poll (useful during development / testing).
 * Only available in non-production environments.
 */
async function triggerPoll(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  try {
    const { pollPrices } = require('../services/pollerService');
    // Run in background, respond immediately
    pollPrices().catch(console.error);
    res.json({ message: 'Poll triggered' });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/password
 * Change password — requires current password.
 */
async function changePassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await UserModel.findByEmail(req.user.email);
    const valid = await UserModel.verifyPassword(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    await UserModel.changePassword(req.user.id, newPassword);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/users/me
 * Delete (deactivate) account.
 */
async function deleteAccount(req, res, next) {
  try {
    await UserModel.deleteAccount(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/settings
 * Update user settings (default threshold, email notifications).
 */
async function updateSettings(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { defaultThresholdPercent, emailNotificationsEnabled, notificationEmail } = req.body;
    await UserModel.updateSettings(req.user.id, {
      defaultThresholdPercent,
      emailNotificationsEnabled,
      notificationEmail,
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { updatePushToken, getProfile, triggerPoll, changePassword, deleteAccount, updateSettings };
