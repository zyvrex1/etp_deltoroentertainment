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
  timestamps: true,
  shardKey: { email: "hashed" } // Uncomment when upgrading to M10+ dedicated cluster
})

// ── Performance indexes ───────────────────────────────────────────────────────
auditLogSchema.index({ createdAt: -1 })
auditLogSchema.index({ createdAt: -1, action: 1 })
auditLogSchema.index({ email: 1 })

auditLogSchema.index(                                  // ← completed
  { email: 'text', details: 'text', firstName: 'text', lastName: 'text' },
  {
    name: 'audit_search',
    weights: { email: 10, firstName: 5, lastName: 5, details: 1 }
  }
)

module.exports = mongoose.model('AuditLog', auditLogSchema)