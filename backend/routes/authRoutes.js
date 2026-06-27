const express = require('express')
const rateLimit = require('express-rate-limit')

const {
  signupUser,
  loginUser,
  refreshToken,
  logoutUser,
  getProfile,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController')

const requireAuth = require('../middleware/requireAuth')
const { validateLogin, validateSignup, validateResetPassword, validateForgotPassword } = require('../middleware/validateAuth')

const router = express.Router()

// ── Strict limiter for brute-force protection ─────────────────
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
})

// ── Refresh gets its own lenient limiter ──────────────────────
// Silent background calls happen frequently; 60/15 min is still safe
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many refresh attempts, please log in again.' },
})

const noCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  })
  next()
}

// ── Public routes ─────────────────────────────────────────────
router.post('/signup',          strictAuthLimiter, validateSignup,          signupUser)
router.post('/login',           strictAuthLimiter, validateLogin,           loginUser)
router.post('/forgot-password', strictAuthLimiter, validateForgotPassword,  forgotPassword)
router.post('/reset-password',  strictAuthLimiter, validateResetPassword,  resetPassword)

// Refresh — reads HttpOnly cookie, no auth header needed
router.post('/refresh', refreshLimiter, noCache, refreshToken)

// Logout — works even without a valid access token
// (user may be logging out because their token just expired)
router.post('/logout', logoutUser)

// ── Protected routes ──────────────────────────────────────────
router.get('/profile',          requireAuth, noCache, getProfile)
router.put('/update-profile',   requireAuth, updateProfile)
router.put('/update-password',  requireAuth, updatePassword)

module.exports = router