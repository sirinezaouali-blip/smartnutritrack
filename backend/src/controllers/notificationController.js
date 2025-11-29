const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    const notifications = await Notification.getUserNotifications(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notifications',
      error: error.message
    });
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { notificationIds } = req.body;

    await Notification.markAsRead(userId, notificationIds);

    res.json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking notifications as read',
      error: error.message
    });
  }
};

// @desc    Create notification (internal use)
// @access  Private
const createNotification = async (notificationData) => {
  try {
    return await Notification.createNotification(notificationData);
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification
};