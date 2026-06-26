const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const validator = require('validator')

const Schema = mongoose.Schema

// ─── Lockout constants ────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS    = 15 * 60 * 1000   // 15 minutes

const userSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
  },
  companyName: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'promoter', 'sponsor', 'customer'],
    required: true
  },

  // ✅ Security
  twoFactor: {
    type: Boolean,
    default: false
  },

  // ✅ Notifications
  notifications: {
    email:            { type: Boolean, default: true },
    sms:              { type: Boolean, default: false },
    userUpdates:      { type: Boolean, default: true },
    paymentReminders: { type: Boolean, default: true },
    announcements:    { type: Boolean, default: true },
    supportMessages:  { type: Boolean, default: true }
  },

  lastLogin: {
    type: Date
  },

  lastActive: {
    type: Date
  },

  avatar: {
    type: String,
    default: '',
  },

  cart: {
    type: Array,
    default: []
  },

  paymentMethods: [{
    type:          { type: String },
    last4:         { type: String },
    expires:       { type: String },
    isDefault:     { type: Boolean, default: false },
    icon:          { type: String },
    methodType:    { type: String },
    cardNumber:    { type: String },
    cardHolder:    { type: String },
    accountNumber: { type: String },
    accountHolder: { type: String },
    routingNumber: { type: String },
    paypalEmail:   { type: String }
  }],

  // ─── Step 27: Account Lockout ─────────────────────────────
  // Counts consecutive failed login attempts. Resets to 0 on
  // successful login or after the lock window expires.
  failedLoginAttempts: {
    type:    Number,
    default: 0,
  },

  // When this field is set and is in the future, the account is locked.
  // Set to null (or a past date) when the lock clears.
  lockedUntil: {
    type:    Date,
    default: null,
  },

  passwordResetToken: {
  type:    String,
  default: null,
},
passwordResetExpires: {
  type:    Date,
  default: null,
}

}, 

{
  timestamps: true
  // shardKey: { email: "hashed" } // Uncomment when upgrading to M10+ dedicated cluster
})

// ─── Instance helper: is this account currently locked? ───────
userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date()
}

// ─── Instance helper: ms remaining on the lock ────────────────
userSchema.methods.lockRemainingMs = function () {
  if (!this.isLocked()) return 0
  return this.lockedUntil - Date.now()
}

// ================= SIGNUP =================
userSchema.statics.signup = async function (
  email,
  password,
  confirmPassword,
  role,
  firstName,
  lastName
) {
  if (!email || !password || !confirmPassword || !role) {
    throw Error('All fields are required')
  }

  if (password !== confirmPassword) {
    throw Error('Passwords do not match')
  }

  if (!validator.isEmail(email)) {
    throw Error('Email is not valid')
  }

  if (!validator.isStrongPassword(password)) {
    throw Error('Password is not strong enough')
  }

  const normalizedEmail = email.toLowerCase().trim()
  const exists = await this.findOne({ email: normalizedEmail })
  if (exists) {
    throw Error('Email already in use')
  }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)

  const user = await this.create({
    email,
    password: hash,
    role,
    firstName,
    lastName
  })

  return user
}

// ================= LOGIN =================
userSchema.statics.login = async function (email, password) {
  if (!email || !password) throw Error('All fields must be filled')

  const normalizedEmail = email.toLowerCase().trim()
  console.log('--- LOGIN DEBUG ---')
  console.log('Querying for:', `"${normalizedEmail}"`)
  console.log('Connection Host:', this.db.host)
  console.log('Database Name:', this.db.name)

  const user = await this.findOne({ email: normalizedEmail })
  if (!user) {
    // Don't reveal whether the email exists — just say incorrect email.
    // No lockout tracking on non-existent accounts (nothing to lock).
    throw Error('Incorrect email')
  }

  // ── Step 27: Check if the account is currently locked ───────
  if (user.isLocked()) {
    const remainingMs  = user.lockRemainingMs()
    const remainingMin = Math.ceil(remainingMs / 60_000)
    throw Object.assign(
      Error(`Account temporarily locked. Try again in ${remainingMin} minute${remainingMin !== 1 ? 's' : ''}.`),
      { code: 'ACCOUNT_LOCKED', remainingMs }
    )
  }

  const match = await bcrypt.compare(password, user.password)

  if (!match) {
    // ── Step 27: Increment failure counter ───────────────────
    user.failedLoginAttempts += 1

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      // Apply the lock
      user.lockedUntil          = new Date(Date.now() + LOCK_DURATION_MS)
      user.failedLoginAttempts  = MAX_FAILED_ATTEMPTS  // cap — don't keep incrementing
      await user.save()

      throw Object.assign(
        Error(`Too many failed attempts. Account locked for 15 minutes.`),
        { code: 'ACCOUNT_LOCKED', remainingMs: LOCK_DURATION_MS }
      )
    }

    const attemptsLeft = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts
    await user.save()

    throw Error(
      `Incorrect password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`
    )
  }

  // ── Step 27: Successful login — clear lockout state ─────────
  user.failedLoginAttempts = 0
  user.lockedUntil         = null
  await user.save()

  return user
}

userSchema.index({ role: 1, lastActive: -1 })
userSchema.index({ role: 1, createdAt: -1 })

module.exports = mongoose.model('User', userSchema)