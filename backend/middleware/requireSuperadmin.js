
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const { getJwtSecret } = require('../utils/jwt')

const requireSuperadmin = async (req, res, next) => {
  const { authorization } = req.headers
  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' })
  }

  const token = authorization.split(' ')[1]
  try {
    const { _id } = jwt.verify(token, getJwtSecret())
    const user = await User.findById(_id)
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied' })
    }
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = requireSuperadmin