const express = require('express')
const rateLimit = require('express-rate-limit')

const { signupUser, loginUser, getProfile, updateProfile, updatePassword, forgotPassword } = require('../controllers/authController')
const requireAuth = require('../middleware/requireAuth')
const { validateLogin, validateSignup, validateForgotPassword } = require('../middleware/validateAuth') 

const router = express.Router()

// ✅ STEP 13: Strict Rate Limiter for Brute-Force Protection
// Maximum 5 requests per 15 minutes on authentication/password endpoints
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes.' }
})

const noCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
};

// Public routes (Protected by strict rate limiter)
router.post('/signup', strictAuthLimiter, validateSignup, signupUser)
router.post('/login', strictAuthLimiter, validateLogin, loginUser)
router.post('/forgot-password', strictAuthLimiter, validateForgotPassword, forgotPassword)

// Protected routes
router.get('/profile', requireAuth, getProfile)
router.put('/update-profile', requireAuth, updateProfile)
router.put('/update-password', requireAuth, updatePassword)

module.exports = router