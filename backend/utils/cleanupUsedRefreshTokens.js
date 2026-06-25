const RefreshToken = require('../models/refreshTokenModel')

async function cleanupUsedRefreshTokens() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  try {
    const result = await RefreshToken.deleteMany({
      used:      true,
      updatedAt: { $lt: fiveMinutesAgo },
    })
    if (result.deletedCount > 0) {
      console.log(`[Cleanup] Removed ${result.deletedCount} used refresh token(s)`)
    }
  } catch (err) {
    console.error('[Cleanup] Failed to remove used refresh tokens:', err.message)
  }
}

module.exports = { cleanupUsedRefreshTokens }