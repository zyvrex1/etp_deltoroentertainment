const express = require('express')
const { createUser, getAllUsers, getUser, updateUser, deleteUser } = require('../controllers/superadminController')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')

const router = express.Router()

router.use(requireAuth)

router.post(
  '/create-user',
  requireRole('admin', 'superadmin'), 
  createUser
)

router.get(
  '/users',
  requireRole('admin', 'superadmin'),
  getAllUsers
)

router.get(
  '/users/:id',
  requireRole('admin', 'superadmin'),
  getUser
)

router.patch(
  '/users/:id',
  requireRole('admin', 'superadmin'),
  updateUser
)

router.delete(
  '/users/:id',
  requireRole('admin', 'superadmin'),
  deleteUser
)



module.exports = router