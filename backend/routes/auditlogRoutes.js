const express = require('express')
const router  = express.Router()

const { getAuditLogs } = require('../controllers/auditlogController')
const requireAuth      = require('../middleware/requireAuth')   // your existing auth middleware
const requireRole      = require('../middleware/requireRole')   // your existing role middleware

// Admin-only — adjust middleware names to match your project
router.get('/', requireAuth, requireRole('admin'), getAuditLogs)

module.exports = router