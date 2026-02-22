const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')

const router = express.Router()

router.use(requireAuth)
router.use(requireRole('customer'))

router.get('/customerdashboard', (req, res) => {
  res.json({ message: 'Customer Dashboard' })
})

module.exports = router