const express = require('express')
const { createUser, getAllUsers, getUser, updateUser } = require('../controllers/superadminController')
const requireSuperadmin = require('../middleware/requireSuperadmin')

const router = express.Router()

// Only superadmin can create any user
router.post('/create-user', requireSuperadmin, createUser)

// Get all users – superadmin only
router.get('/users', requireSuperadmin, getAllUsers)

// Get a single user – superadmin only
router.get('/users/:id', requireSuperadmin, getUser)

router.patch('/users/:id', requireSuperadmin, updateUser)

module.exports = router