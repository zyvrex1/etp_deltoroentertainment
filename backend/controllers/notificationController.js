const Notification = require('../models/notificationModel');

// @desc    Get all notifications
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const preferences = user.notifications || {};

        const isAdmin = user.role === 'admin' || user.role === 'superadmin';

        let query;
        if (isAdmin) {
            query = {
                $or: [
                    { userId: null, targetRole: { $in: [null, 'admin', 'all'] } },
                    { userId: user._id }
                ]
            };
        } else if (user.role === 'promoter') {
            query = {
                $or: [
                    { userId: user._id },
                    { userId: null, targetRole: { $in: ['promoter', 'all'] } },
                    { userId: null, type: 'update' } // Fallback for old style broadcast
                ]
            };
        } else {
            query = {
                $or: [
                    { userId: user._id },
                    { userId: null, targetRole: user.role }
                ]
            };
        }

        let notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);

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
        const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
        const isPromoter = req.user.role === 'promoter';
        
        let query;
        if (isAdmin) {
            query = { unread: true, $or: [{ userId: null, targetRole: { $in: [null, 'admin', 'all'] } }, { userId: req.user._id }] };
        } else if (isPromoter) {
            query = { unread: true, $or: [{ userId: req.user._id }, { userId: null, targetRole: { $in: ['promoter', 'all'] } }, { userId: null, type: 'update' }] };
        } else {
            query = { unread: true, $or: [{ userId: req.user._id }, { userId: null, targetRole: req.user.role }] };
        }

        await Notification.updateMany(query, { unread: false });
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
