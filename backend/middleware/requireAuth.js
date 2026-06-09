const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { getJwtSecret } = require('../utils/jwt');

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, getJwtSecret());
    req.user = await User.findOne({ _id }).select('_id role firstName lastName email notifications');
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Update lastActive asynchronously so we don't block the request
    User.updateOne({ _id }, { lastActive: new Date() }).catch(err => console.error("Failed to update lastActive", err));

    next();

  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = requireAuth;