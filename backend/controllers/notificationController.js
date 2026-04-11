const Notification = require('../models/notificationModel');

// @desc    Get all notifications
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const preferences = user.notifications || {};

        let notifications = await Notification.find({
            $or: [
                { userId: null },
                { userId: user._id }
            ]
        }).sort({ createdAt: -1 }).limit(50);

        // Filter based on user preferences
        const filteredNotifications = notifications.filter(notif => {
            if (notif.type === 'concern' && preferences.supportMessages === false) return false;
            if (notif.type === 'user' && preferences.userUpdates === false) return false;
            if (notif.type === 'payment' && preferences.paymentReminders === false) return false;
            if (notif.type === 'update' && preferences.announcements === false) return false;
            return true;
        });

        res.status(200).json(filteredNotifications);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
const markAsRead = async (req, res) => {
    const { id } = req.params;
    try {
        const notification = await Notification.findByIdAndUpdate(id, { unread: false }, { new: true });
        res.status(200).json(notification);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { unread: true, $or: [{ userId: null }, { userId: req.user._id }] }, 
            { unread: false }
        );
        res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Internal function to create notification
const createNotification = async (data) => {
    try {
        const notification = await Notification.create(data);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification
};
