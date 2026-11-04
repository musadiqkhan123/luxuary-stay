import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from './logger.js';

/**
 * Send an in-app notification to specific users and/or every active user of some roles.
 * Never throws — a failed notification must not break the main action.
 */
const notify = async ({ users = [], roles = [], title, message, type = 'info', link = '' }) => {
  try {
    const ids = new Set(users.filter(Boolean).map(String));
    if (roles.length) {
      const staff = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
      staff.forEach((u) => ids.add(String(u._id)));
    }
    if (!ids.size) return;
    await Notification.insertMany([...ids].map((recipient) => ({ recipient, title, message, type, link })));
  } catch (error) {
    logger.warn(`Notification failed: ${error.message}`);
  }
};

export default notify;
