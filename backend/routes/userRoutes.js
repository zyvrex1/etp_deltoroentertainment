const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

const { getUserById, updateProfile, updateSecurity, updateNotifications, upload } = require('../controllers/userController');

// ✅ Single route to update profile + avatar
router.get("/:id", requireAuth, getUserById);
router.put('/profile', requireAuth, upload.single('avatar'), updateProfile);

// Other routes
router.put('/security', requireAuth, updateSecurity);
router.put('/notifications', requireAuth, updateNotifications);

module.exports = router;