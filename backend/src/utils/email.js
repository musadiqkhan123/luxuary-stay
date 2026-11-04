import Setting from '../models/Setting.js';
import { getTransporter, isEmailConfigured } from '../config/mailer.js';
import { templates } from '../emails/templates.js';
import logger from './logger.js';

export const appUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');

const hotelInfo = async () => {
  const s = await Setting.getSingleton();
  return {
    name: s.hotelName, email: s.email, phone: s.phone, address: s.address, currency: s.currency, taxRate: s.taxRate,
    checkInTime: s.checkInTime, checkOutTime: s.checkOutTime, cancellationPolicy: s.policies?.cancellation || '',
  };
};

/**
 * Send a templated email. Never throws — email problems must not break bookings or logins.
 * sendEmail('bookingConfirmed', { to: 'a@b.com', booking })
 * Returns true when the email was handed to the SMTP server.
 */
export const sendEmail = async (template, { to, ...data }) => {
  try {
    if (!to) return false;
    const hotel = await hotelInfo();
    const { subject, html, text } = templates[template]({ hotel, appUrl: appUrl(), ...data });

    if (!isEmailConfigured()) {
      logger.warn(`Email not sent (SMTP not configured): "${subject}" → ${to}`);
      if (data.link) logger.info(`Link for testing: ${data.link}`);
      return false;
    }

    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `"${hotel.name}" <${process.env.SMTP_USER}>`,
      replyTo: hotel.email,
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent: "${subject}" → ${to}`);
    return true;
  } catch (error) {
    logger.warn(`Email "${template}" to ${to} failed: ${error.message}`);
    return false;
  }
};
