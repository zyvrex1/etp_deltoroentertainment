const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

const { getUserById, updateProfile, updateSecurity, updateNotifications, upload, getAdminPaymentMethods, getPromoters, getSponsors, updateCart, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } = require('../controllers/userController');

// ✅ Get Admin payment methods (publicly accessible or just requireAuth)
router.get("/admin/payment-methods", requireAuth, getAdminPaymentMethods);

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

// Payment Methods routes
router.post('/payment-methods', requireAuth, addPaymentMethod);
router.delete('/payment-methods/:methodId', requireAuth, removePaymentMethod);
router.put('/payment-methods/:methodId/default', requireAuth, setDefaultPaymentMethod);

module.exports = router;