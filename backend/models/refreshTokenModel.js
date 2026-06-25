const mongoose = require('mongoose')

// Stores hashed refresh tokens only — raw token never persisted.
// `family` groups all rotations from the same original login so that
// if a used token is presented again we can invalidate the entire family
// (refresh token reuse / replay attack detection).
const refreshTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  family: {
    // All rotated descendants share the same family UUID
    type: String,
    required: true,
  },
  used: {
    // Once rotated, the old token is marked used but kept briefly
    // so we can detect replay attacks within the same family
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true })

// TTL index — MongoDB auto-deletes expired documents
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
// Fast lookup by userId when logging out all sessions
refreshTokenSchema.index({ userId: 1 })
// Fast lookup by family for reuse detection
refreshTokenSchema.index({ family: 1 })

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)