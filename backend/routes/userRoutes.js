const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

const { getUserById, updateProfile, updateSecurity, updateNotifications, upload, getPromoters, getSponsors, updateCart } = require('../controllers/userController');

// ✅ Search promoters for collaboration
router.get("/promoters", requireAuth, getPromoters);

// ✅ Search sponsors for exhibitors
router.get("/sponsors", requireAuth, getSponsors);

// ✅ Single route to update profile + avatar
router.get("/:id", requireAuth, getUserById);
router.put('/profile', requireAuth, upload.single('avatar'), updateProfile);

// Other routes
router.put('/security', requireAuth, updateSecurity);
router.put('/notifications', requireAuth, updateNotifications);
router.put('/cart', requireAuth, updateCart);

module.exports = router;