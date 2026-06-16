const Notification = require('../models/notificationModel');

// @desc    Get all notifications
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const user = req.user;
        const preferences = user.notifications || {};

        const isAdmin = user.role === 'admin' || user.role === 'superadmin';

        const userRoleLower = user.role.toLowerCase();
        let query;
        if (isAdmin) {
            query = {
                $or: [
                    { userId: null, targetRole: { $in: [null, 'admin', 'all'] } },
                    { userId: user._id }
                ]
            };
        } else if (userRoleLower === 'promoter') {
            query = {
                $or: [
                    { userId: user._id },
                    { userId: null, targetRole: { $in: ['promoter', 'all'] } }
                ]
            };
        } else {
            query = {
                $or: [
                    { userId: user._id },
                    { userId: null, targetRole: { $in: [userRoleLower, 'all'] } }
                ]
            };
        }

        const { cursor, limit } = req.pagination;

        // keyset clause on _id
        const cursorClause = cursor ? { _id: { $lt: cursor } } : {};
        // fetch limit+1 to probe
        const raw = await Notification.find({$and: [baseQuery, visClause, cursorClause]}).sort({ createdAt: -1 }).limit(limit + 1);
        const hasNextPage = raw.length > limit;
        if (hasNextPage) raw.pop();
        const nextCursor = hasNextPage && raw.length ? raw.at(-1)._id.toString(): null;


        // returns envelope
        res.status(200).json({
            notifications: filtered,
            pagination: { nextCursor, hasNextPage, limit }

        });
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
            query = { unread: true, $or: [{ userId: req.user._id }, { userId: null, targetRole: { $in: [req.user.role, 'all'] } }, { userId: null, type: { $in: ['update', 'announcement'] } }] };
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
