const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// ─── Secret helpers ───────────────────────────────────────────
function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

function getRefreshSecret() {
  // Separate secret so a compromised JWT_SECRET doesn't expose refresh tokens
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured')
  return secret
}

// ─── Access token (short-lived, sent in response body) ────────
// 15 minutes default — stolen tokens expire quickly
function createAccessToken(user) {
  return jwt.sign(
    { _id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
}

// ─── Refresh token (long-lived, stored in HttpOnly cookie) ────
// Raw token returned so it can be hashed before DB storage.
// Never call jwt.sign on this outside this file.
function createRefreshToken(user) {
  return jwt.sign(
    { _id: user._id },               // minimal payload — role not needed
    getRefreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  )
}

// ─── Verify helpers ───────────────────────────────────────────
function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret())
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getRefreshSecret())
}

// ─── Hashing helper ───────────────────────────────────────────
// Refresh tokens are stored as SHA-256 hashes — raw token never in DB
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

// ─── Cookie options ───────────────────────────────────────────
// Centralised so every set/clear call uses identical flags
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production'
  const raw    = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  const days   = parseInt(raw, 10) || 7   // add radix 10 to be explicit

  return {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge:   days * 24 * 60 * 60 * 1000,
    path:     '/api/auth',
  }
}

module.exports = {
  getJwtSecret,
  getRefreshSecret,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
}