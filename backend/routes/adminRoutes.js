const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')

const router = express.Router()

router.use(requireAuth)
router.use(requireRole('admin'))

router.get('/admindashboard', (req, res) => {
  res.json({ message: 'Admin Dashboard' })
})

module.exports = router