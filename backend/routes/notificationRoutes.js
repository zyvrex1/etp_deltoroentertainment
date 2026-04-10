const express = require('express');
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

// Require auth for all notification routes
router.use(requireAuth);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
