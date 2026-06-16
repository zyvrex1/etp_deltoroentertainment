const express  = require('express')
const router   = express.Router()
const { getAuditLogs }        = require('../controllers/auditlogController')
const requireAuth             = require('../middleware/requireAuth')
const requireRole             = require('../middleware/requireRole')
const paginate                = require('../middleware/paginate')
const { validateOffsetQuery } = require('../middleware/validateSchemas')
 
router.get('/',
  requireAuth,
  requireRole('admin'),
  validateOffsetQuery,   // ← Zod: validates page, limit, sort, order, search
  paginate,              // ← sets req.pagination (page, skip, limit, sort, order)
  getAuditLogs
)
 
module.exports = router