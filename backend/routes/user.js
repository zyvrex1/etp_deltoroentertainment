const express = require('express')

const {signupUser, loginUser} = require('../controllers/userController')

const router = express.Router()

// Login
router.post('/login', loginUser)

// Signup
router.post('/signup', signupUser)

module.exports = router