import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';

// GET /api/notifications
export const getNotifications = async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);
  res.json({ success: true, data: items, meta: { unread } });
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
};

// PATCH /api/notifications/:id/read
export const markRead = async (req, res) => {
  const item = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true }, { new: true });
  if (!item) throw new ApiError(404, 'Notification not found.');
  res.json({ success: true, data: item });
};
