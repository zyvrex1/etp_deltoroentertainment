
const express = require('express')
const router = express.Router()
const { createUser } = require('../controllers/superadminController')
const requireSuperadmin = require('../middleware/requireSuperadmin')

router.post('/create-user', requireSuperadmin, createUser)

module.exports = router