const express = require('express')
const { getNotifications, markAsRead, markAllAsRead }
  = require('../controllers/notificationController')
const requireAuth             = require('../middleware/requireAuth')
const paginate                = require('../middleware/paginate')
const { validateCursorQuery } = require('../middleware/validateSchemas')
 
const router = express.Router()
router.use(requireAuth)
 
router.get('/',
  validateCursorQuery,   // ← Zod: validates cursor, limit, sort, order
  paginate,              // ← sets req.pagination (cursor, limit, sort, order)
  getNotifications
)
 
router.patch('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)
 
module.exports = router