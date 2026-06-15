const SecurityEvents = require('../utils/securityEvents')

function onRateLimitExceeded(req, res) {
  SecurityEvents.rateLimitHit({
    ip:     req.ip,
    route:  req.originalUrl,
    userId: req.user?.id,
  })

  res.status(429).json({
    error: 'Too many requests. Please try again later.',
  })
}

module.exports = { onRateLimitExceeded }