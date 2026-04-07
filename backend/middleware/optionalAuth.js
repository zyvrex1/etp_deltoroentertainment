const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const optionalAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || authorization === 'Bearer undefined') {
    return next();
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, process.env.SECRET);
    req.user = await User.findOne({ _id }).select('_id role firstName lastName email');
    next();
  } catch (error) {
    // If token is invalid, continue as visitor
    console.warn("Invalid token in optionalAuth, proceeding as guest.");
    next();
  }
};

module.exports = optionalAuth;
