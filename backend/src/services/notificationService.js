const { Expo } = require('expo-server-sdk');
const logger = require('../config/logger');

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

/**
 * Send price-drop push notifications to one or more users.
 *
 * @param {Array<{ pushToken: string, title: string, body: string, data?: object }>} messages
 */
async function sendPushNotifications(messages) {
  // Filter to valid Expo tokens only
  const chunks = expo.chunkPushNotifications(
    messages
      .filter((m) => Expo.isExpoPushToken(m.pushToken))
      .map((m) => ({
        to: m.pushToken,
        sound: 'default',
        title: m.title,
        body: m.body,
        data: m.data || {},
        priority: 'high',
      }))
  );

  const receipts = [];
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      receipts.push(...ticketChunk);

      ticketChunk.forEach((ticket, i) => {
        if (ticket.status === 'error') {
          logger.warn(`Push notification error for token ${chunk[i].to}: ${ticket.message}`, {
            details: ticket.details,
          });
        }
      });
    } catch (err) {
      logger.error('Failed to send push notification chunk:', err);
    }
  }

  return receipts;
}

/**
 * Build and send a price-drop alert notification.
 *
 * @param {{ pushToken: string, productTitle: string, oldPrice: number, newPrice: number, dropPercent: number, asin: string }} opts
 */
async function sendPriceDropAlert({ pushToken, productTitle, oldPrice, newPrice, dropPercent, asin }) {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    logger.debug(`Skipping push — invalid or missing token for ASIN ${asin}`);
    return;
  }

  const savings = (oldPrice - newPrice).toFixed(2);
  const body = `Dropped ${dropPercent.toFixed(0)}% · Now $${newPrice.toFixed(2)} (was $${oldPrice.toFixed(2)}, save $${savings})`;

  return sendPushNotifications([
    {
      pushToken,
      title: `Price drop on ${productTitle.slice(0, 50)}`,
      body,
      data: { asin, oldPrice, newPrice, dropPercent },
    },
  ]);
}

module.exports = { sendPushNotifications, sendPriceDropAlert };
