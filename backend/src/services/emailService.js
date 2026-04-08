const nodemailer = require('nodemailer');
const logger = require('../config/logger');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

/**
 * Send a price drop email alert to a user.
 */
async function sendPriceDropEmail({ to, productTitle, oldPrice, newPrice, dropPercent, productUrl, imageUrl }) {
  const transporter = getTransporter();
  if (!transporter) {
    logger.debug('Email skipped: SMTP not configured');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const savings = (oldPrice - newPrice).toFixed(2);
  const formattedDrop = `${Math.abs(dropPercent).toFixed(1)}%`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0F0F14; color: #F0F0F5; border-radius: 12px; overflow: hidden;">
      <div style="background: #6C63FF; padding: 24px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 24px;">Price Drop Alert!</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 16px;">Save ${formattedDrop} on a tracked product</p>
      </div>
      <div style="padding: 24px;">
        ${imageUrl ? `<img src="${imageUrl}" alt="" style="width: 120px; height: 120px; object-fit: contain; display: block; margin: 0 auto 16px; background: #22222F; border-radius: 8px;" />` : ''}
        <h2 style="margin: 0 0 16px; font-size: 16px; color: #F0F0F5; line-height: 1.4;">${productTitle}</h2>
        <div style="background: #22222F; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
          <span style="font-size: 28px; font-weight: bold; color: #00D4A0;">$${newPrice.toFixed(2)}</span>
          <span style="font-size: 16px; color: #888; text-decoration: line-through; margin-left: 12px;">$${oldPrice.toFixed(2)}</span>
          <div style="margin-top: 8px; color: #00D4A0; font-size: 14px;">You save $${savings} (${formattedDrop} off)</div>
        </div>
        <a href="${productUrl}" style="display: block; background: #6C63FF; color: #fff; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View on Amazon →</a>
      </div>
      <div style="padding: 16px 24px; text-align: center; color: #55556A; font-size: 12px;">
        You're receiving this because you track this product on DropAlert.<br/>
        <a href="" style="color: #6C63FF;">Manage notifications in settings</a>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `Price Drop: ${formattedDrop} off — ${productTitle.slice(0, 60)}`,
      html,
    });
    logger.info(`Email sent to ${to} for ${productTitle.slice(0, 40)}`);
  } catch (err) {
    logger.error('Failed to send email:', err.message);
  }
}

module.exports = { sendPriceDropEmail };
