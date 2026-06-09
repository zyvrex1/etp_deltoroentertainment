// Single source of truth for JWT signing/verification secret.
// Supports JWT_SECRET (current .env key) with SECRET fallback for older configs.
function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }
  return secret
}

module.exports = { getJwtSecret }
