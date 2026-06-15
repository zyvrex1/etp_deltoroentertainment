const { appLogger } = require('../config/logger')

module.exports = function requestLogger(req, res, next) {
  const start = Date.now()

  res.on('finish', () => {
    const durationMs = Date.now() - start
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info'

    appLogger[level]('HTTP request', {
      method:     req.method,
      route:      req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip:         req.ip,
      userAgent:  req.get('User-Agent'),
      userId:     req.user?.id || null,
    })
  })

  next()
}