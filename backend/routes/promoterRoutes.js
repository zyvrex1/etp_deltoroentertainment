const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')

const router = express.Router()

router.use(requireAuth)
router.use(requireRole('promoter'))

router.get('/promoterdashboard', (req, res) => {
  res.json({ message: 'Promoter Dashboard' })
})

module.exports = router