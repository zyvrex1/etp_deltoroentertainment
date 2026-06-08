const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'USER_SIGNUP', 'USER_CREATED'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  email:     { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  role:      { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  details:   { type: String, default: '' },
}, {
  timestamps: true
})

// ── Performance indexes ───────────────────────────────────────────────────────
auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ createdAt: -1, action: 1 })
auditLogSchema.index({ email: 1 })

// Text index — replaces slow per-field regex scans when searching


// TTL index — auto-delete records older than 1 year (uncomment if desired)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 })

module.exports = mongoose.model('AuditLog', auditLogSchema)