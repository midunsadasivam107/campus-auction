const Notification = require('../models/Notification');

/**
 * Creates in-app notification with deduplication protection
 * Also broadcasts real-time alert via Socket.IO if available
 */
const createNotification = async ({
  userId,
  type,
  title,
  message,
  listingId = null,
  dedupKey = null,
  io = null,
}) => {
  try {
    // If dedupKey is provided, check if it already exists
    if (dedupKey) {
      const existing = await Notification.findOne({ dedupKey });
      if (existing) return existing;
    }

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      listing: listingId,
      dedupKey,
      createdAt: new Date(),
    });

    // Real-time broadcast to user's private room
    if (io) {
      io.to(`user:${userId}`).emit('new-notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        listing: notification.listing,
        createdAt: notification.createdAt,
        isRead: false,
      });
    }

    return notification;
  } catch (err) {
    // Ignore duplicate key errors silently (dedup protection)
    if (err.code === 11000) return null;
    console.error('Error creating notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
