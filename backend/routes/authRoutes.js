const express = require('express')

const { signupUser, loginUser, getProfile, updateProfile, updatePassword } = require('../controllers/authController')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

// Public routes
router.post('/login', loginUser)
router.post('/signup', signupUser)

// Protected routes
router.get('/profile', requireAuth, getProfile)
router.put('/update-profile', requireAuth, updateProfile)
router.put('/update-password', requireAuth, updatePassword)

module.exports = router