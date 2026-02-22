const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')

const router = express.Router()

router.use(requireAuth)
router.use(requireRole('sponsor'))

router.get('/sponsordashboard', (req, res) => {
  res.json({ message: 'Sponsor Dashboard' })
})

module.exports = router