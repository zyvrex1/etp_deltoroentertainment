const express = require('express')

const { signupUser, loginUser, getProfile, updateProfile, updatePassword, forgotPassword } = require('../controllers/authController')
const requireAuth = require('../middleware/requireAuth')
const { validateLogin, validateSignup, validateForgotPassword } = require('../middleware/validateAuth') // ← add this

const router = express.Router()

// Auth-specific rate limiter (uncomment when ready)
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 20,
//   message: { error: 'Too many login attempts, please try again in 15 minutes.' }
// })

const noCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  next();
};

// Public routes
router.post('/signup', validateSignup, signupUser)
router.post('/login', validateLogin, loginUser)
router.post('/forgot-password', validateForgotPassword, forgotPassword)

// Protected routes
router.get('/profile', requireAuth, getProfile)
router.put('/update-profile', requireAuth, updateProfile)
router.put('/update-password', requireAuth, updatePassword)

module.exports = router