const express = require('express')
const { createUser, getAllUsers, getUser, updateUser, deleteUser } = require('../controllers/superadminController')
const requireSuperadmin = require('../middleware/requireSuperadmin')

const router = express.Router()

// Only superadmin can create any user
router.post('/create-user', requireSuperadmin, createUser)

// Get all users – superadmin only
router.get('/users', requireSuperadmin, getAllUsers)

// Get a single user – superadmin only
router.get('/users/:id', requireSuperadmin, getUser)

router.patch('/users/:id', requireSuperadmin, updateUser)

router.delete('/users/:id', requireSuperadmin, deleteUser)

module.exports = router