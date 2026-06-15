const { securityLogger } = require('../config/logger')

const SecurityEvents = {

  // ── Authentication ────────────────────────────────────────
  failedLogin({ ip, userId, reason }) {
    securityLogger.warn('Failed login attempt', {
      event:  'FAILED_LOGIN',
      ip,
      userId: userId || 'unknown',
      reason,
    })
  },

  successfulLogin({ ip, userId }) {
    securityLogger.info('User authenticated', {
      event:  'LOGIN_SUCCESS',
      ip,
      userId,
    })
  },

  // ── Transactions / Ticket purchases ───────────────────────
  invalidSignature({ ip, userId, transactionId, reason }) {
    securityLogger.error('Transaction signature validation failed', {
      event:         'INVALID_TX_SIGNATURE',
      ip,
      userId,
      transactionId,
      reason,
      severity:      'CRITICAL',
    })
  },

  unauthorizedTxAmount({ ip, userId, amount, limit }) {
    securityLogger.warn('Transaction amount exceeds user limit', {
      event:    'TX_AMOUNT_EXCEEDED',
      ip,
      userId,
      amount,
      limit,
      severity: 'HIGH',
    })
  },

  // ── Rate Limiting ─────────────────────────────────────────
  rateLimitHit({ ip, route, userId }) {
    securityLogger.warn('Rate limit triggered', {
      event:  'RATE_LIMIT_HIT',
      ip,
      route,
      userId: userId || 'anonymous',
    })
  },

  // ── Access Control ────────────────────────────────────────
  unauthorizedAccess({ ip, userId, route, method }) {
    securityLogger.warn('Unauthorized route access attempt', {
      event:  'UNAUTHORIZED_ACCESS',
      ip,
      route,
      method,
      userId: userId || 'anonymous',
    })
  },

  // ── Suspicious Behavior ───────────────────────────────────
  suspiciousPattern({ ip, userId, detail }) {
    securityLogger.error('Suspicious activity detected', {
      event:    'SUSPICIOUS_PATTERN',
      ip,
      userId,
      detail,
      severity: 'CRITICAL',
    })
  },
}

module.exports = SecurityEvents