const express = require('express')

const { signupUser, loginUser, getProfile, updateProfile, updatePassword, forgotPassword } = require('../controllers/authController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// Public routes
router.post('/login', loginUser)
router.post('/signup', signupUser)
router.post('/forgot-password', forgotPassword)

// Protected routes
router.get('/profile', requireAuth, getProfile)
router.put('/update-profile', requireAuth, updateProfile)
router.put('/update-password', requireAuth, updatePassword)

module.exports = router