const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const RefreshToken = require('../models/refreshTokenModel')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { sendEmail } = require('../utils/email')
const { emitUpdate } = require('../socket')
const { recordAuditLog, emitAuditSocketEvents } = require('./auditlogController')
const SecurityEvents = require('../utils/securityEvents')
const {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
} = require('../utils/jwt')

// ─── Helpers ──────────────────────────────────────────────────

// Parses the refresh token expiry string (e.g. "7d", "30d") into a JS Date
function refreshExpiresAt() {
  const raw  = process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  const days = parseInt(raw)                        // "7d" → 7
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

// Issues both tokens, persists the hashed refresh token, sets the cookie.
// Pass `family` when rotating; omit it for a fresh login (new family created).
async function issueTokens(user, res, family = null) {
  const accessToken  = createAccessToken(user)
  const rawRefresh   = createRefreshToken(user)
  const tokenHash    = hashToken(rawRefresh)
  const tokenFamily  = family || crypto.randomUUID()

  await RefreshToken.create({
    tokenHash,
    userId:    user._id,
    family:    tokenFamily,
    expiresAt: refreshExpiresAt(),
  })

  res.cookie('refreshToken', rawRefresh, refreshCookieOptions())

  return accessToken
}

// ─── IP / UA helper ───────────────────────────────────────────
function getClientMeta(req) {
  return {
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '',
    ua: req.headers['user-agent'] || '',
  }
}

// ================= SIGNUP =================
const signupUser = async (req, res) => {
  const { role, email, password, confirmPassword, firstName, lastName, phone, companyName, industry } = req.body || {}

  try {
    if (!role || !email || !password || !confirmPassword) throw Error('Required fields missing')
    if (!['customer', 'sponsor'].includes(role)) throw Error('Invalid role for public signup')

    const user = await User.signup(email, password, confirmPassword, role, firstName, lastName)

    user.phone = phone || ''
    await user.save()

    if (role === 'customer') {
      if (!firstName || !lastName || !phone) throw Error('Missing customer fields')
      await Customer.create({ userId: user._id, phone })
    }

    if (role === 'sponsor') {
      if (!firstName || !lastName || !phone || !companyName || !industry) throw Error('Missing sponsor fields')
      await Sponsor.create({ userId: user._id, phone, companyName, industry })

      const notificationController = require('./notificationController')
      const notification = await notificationController.createNotification({
        title:      `New sponsor registered: ${firstName} ${lastName}`,
        content:    `from ${companyName}`,
        type:       'user',
        path:       '/admin/users',
        unread:     true,
        createdBy:  user._id,
        targetRole: 'admin',
      })
      emitUpdate('newNotification', notification)

      const selfNotification = await notificationController.createNotification({
        title:     'Welcome to eTicketsPro!',
        content:   'Your sponsor account has been successfully created.',
        type:      'user',
        path:      '/sponsor/settings',
        unread:    true,
        userId:    user._id,
        createdBy: user._id,
      })
      emitUpdate('newNotification', selfNotification)
    }

    const { ip, ua } = getClientMeta(req)

    try {
      await recordAuditLog({
        action:    'USER_SIGNUP',
        userId:    user._id,
        email:     user.email,
        firstName: user.firstName || '',
        lastName:  user.lastName  || '',
        role:      user.role      || '',
        ipAddress: ip,
        userAgent: ua,
        details:   `New ${user.role} account self-registered`,
      })
      SecurityEvents.successfulLogin({ ip, userId: user._id })
    } catch (e) {
      console.error('AuditLog write error:', e.message)
      emitAuditSocketEvents('USER_SIGNUP')
    }

    // ── Issue tokens ──
    const accessToken = await issueTokens(user, res)

    emitUpdate('dashboardUpdate')

    return res.status(201).json({
      _id:       user._id,
      message:   'User created successfully',
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName,
      role:      user.role,
      avatar:    user.avatar,
      token:     accessToken,
    })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// ================= LOGIN =================
const loginUser = async (req, res) => {
  const { email, password, role } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields must be filled' })
  }

  const { ip, ua } = getClientMeta(req)

  try {
    // User.login() now handles lockout checks and failure tracking internally.
    // It throws with err.code === 'ACCOUNT_LOCKED' when the account is locked.
    const user = await User.login(email, password)

    if (role && user.role !== role) {
      throw Error(`Unauthorized. This account is registered as a ${user.role}.`)
    }

    user.lastLogin = new Date()
    await user.save()

    await recordAuditLog({
      action:    'LOGIN_SUCCESS',
      userId:    user._id,
      email:     user.email,
      firstName: user.firstName || '',
      lastName:  user.lastName  || '',
      role:      user.role      || '',
      ipAddress: ip,
      userAgent: ua,
      details:   'User logged in successfully',
    })
    SecurityEvents.successfulLogin({ ip, userId: user._id })

    // ── Issue tokens ──
    const accessToken = await issueTokens(user, res)

    return res.status(200).json({
      _id:            user._id,
      email:          user.email,
      firstName:      user.firstName,
      lastName:       user.lastName,
      role:           user.role,
      phone:          user.phone,
      avatar:         user.avatar,
      twoFactor:      user.twoFactor,
      notifications:  user.notifications,
      cart:           user.cart           || [],
      paymentMethods: user.paymentMethods || [],
      token:          accessToken,
    })

  } catch (err) {
    console.error('Login error:', err.message, 'for email:', email)

    // ── Step 27: Include lockout metadata in the response ─────
    // remainingMs lets the frontend show an accurate countdown timer
    // without the client needing to know the lock duration.
    const isLockout  = err.code === 'ACCOUNT_LOCKED'
    const statusCode = isLockout ? 423 : 401   // 423 Locked is the correct HTTP status

    try {
      const existingUser = await User
        .findOne({ email: email.toLowerCase().trim() })
        .lean()
        .catch(() => null)

      await recordAuditLog({
        action:    isLockout ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        userId:    existingUser?._id || null,
        email:     email.toLowerCase().trim(),
        firstName: existingUser?.firstName || '',
        lastName:  existingUser?.lastName  || '',
        role:      existingUser?.role      || '',
        ipAddress: ip,
        userAgent: ua,
        details:   err.message,
      })
      SecurityEvents.failedLogin({ ip, userId: email, reason: err.message })
    } catch (auditErr) {
      console.error('AuditLog write error:', auditErr.message)
      emitAuditSocketEvents('LOGIN_FAILED')
    }

    // Return the error payload — remainingMs only included on lockout
    return res.status(statusCode).json({
      error:       err.message,
      ...(isLockout && { remainingMs: err.remainingMs }),
    })
  }
}

// ================= REFRESH TOKEN =================
const refreshToken = async (req, res) => {
  const raw = req.cookies?.refreshToken

  if (!raw) {
    return res.status(401).json({ error: 'No refresh token' })
  }

  let payload
  try {
    payload = verifyRefreshToken(raw)
  } catch {
    // Expired or tampered — clear the cookie and bail
    res.clearCookie('refreshToken', refreshCookieOptions())
    return res.status(401).json({ error: 'Refresh token invalid or expired' })
  }

  const tokenHash = hashToken(raw)
  const stored    = await RefreshToken.findOne({ tokenHash })

  if (!stored) {
    // Token not in DB at all — clear cookie
    res.clearCookie('refreshToken', refreshCookieOptions())
    return res.status(401).json({ error: 'Refresh token not recognised' })
  }

  // ── Reuse / replay attack detection ──────────────────────────
  if (stored.used) {
    // This token was already rotated — someone is replaying an old token.
    // Invalidate the entire family to force re-login on all devices that
    // shared this lineage.
    console.warn(`[SECURITY] Refresh token reuse detected — invalidating family ${stored.family}`)
    await RefreshToken.deleteMany({ family: stored.family })
    res.clearCookie('refreshToken', refreshCookieOptions())
    return res.status(401).json({ error: 'Token reuse detected. Please log in again.' })
  }

  // ── Rotate ────────────────────────────────────────────────────
  // Mark old token as used (keep it briefly so replay above works)
  stored.used = true
  await stored.save()

  const user = await User.findById(payload._id).select('_id role')
  if (!user) {
    res.clearCookie('refreshToken', refreshCookieOptions())
    return res.status(401).json({ error: 'User no longer exists' })
  }

  // Issue new tokens in the same family
  const accessToken = await issueTokens(user, res, stored.family)

  return res.status(200).json({ token: accessToken })
}

// ================= LOGOUT =================
const logoutUser = async (req, res) => {
  const raw = req.cookies?.refreshToken

  if (raw) {
    const tokenHash = hashToken(raw)
    await RefreshToken.deleteOne({ tokenHash }).catch(() => {})
  }

  res.clearCookie('refreshToken', refreshCookieOptions())

  try {
    const { ip, ua } = getClientMeta(req)
    const userId = req.user?._id || null

    await recordAuditLog({
      action:    'LOGOUT',
      userId,
      email:     req.user?.email     || '',
      firstName: req.user?.firstName || '',
      lastName:  req.user?.lastName  || '',
      role:      req.user?.role      || '',
      ipAddress: ip,
      userAgent: ua,
      details:   'User logged out',
    })
  } catch (e) {
    console.error('AuditLog write error on logout:', e.message)
  }

  return res.status(200).json({ message: 'Logged out successfully' })
}

// ================= PROFILE =================
const getProfile = async (req, res) => {
  const { _id } = req.user

  try {
    const user = await User.findById(_id).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })

    let profileData = {
      firstName:      user.firstName,
      lastName:       user.lastName,
      email:          user.email,
      phone:          user.phone,
      avatar:         user.avatar,
      notifications:  user.notifications,
      twoFactor:      user.twoFactor,
      cart:           user.cart           || [],
      paymentMethods: user.paymentMethods || [],
    }

    if (user.role === 'promoter') {
      const promoter = await Promoter.findOne({ userId: _id })
      if (promoter) {
        profileData.companyName = promoter.companyName
        profileData.industry    = promoter.industry
        if (promoter.phone) profileData.phone = promoter.phone
      }
    }

    if (user.role === 'sponsor') {
      const sponsor = await Sponsor.findOne({ userId: _id })
      if (sponsor) {
        profileData.companyName   = sponsor.companyName
        profileData.industry      = sponsor.industry
        if (sponsor.phone) profileData.phone = sponsor.phone
        profileData.streetAddress = sponsor.streetAddress
        profileData.city          = sponsor.city
        profileData.zipCode       = sponsor.zipCode
      }
    }

    res.status(200).json(profileData)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const updateProfile = async (req, res) => {
  const { _id } = req.user
  const { firstName, lastName, email, phone, companyName, industry, streetAddress, city, zipCode, avatar, notifications } = req.body

  try {
    const user = await User.findById(_id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (firstName) user.firstName = firstName
    if (lastName)  user.lastName  = lastName
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: _id } })
      if (emailExists) throw Error('Email already in use')
      user.email = email
    }
    if (phone) user.phone = phone
    if (avatar !== undefined) user.avatar = avatar
    if (notifications) {
      user.notifications = {
        ...user.notifications?.toObject?.() || user.notifications,
        ...notifications,
      }
    }
    await user.save()

    if (user.role === 'promoter') {
      const promoter = await Promoter.findOne({ userId: _id })
      if (promoter) {
        if (companyName) promoter.companyName = companyName
        if (industry)    promoter.industry    = industry
        if (phone)       promoter.phone       = phone
        await promoter.save()
      }
    }

    if (user.role === 'sponsor') {
      let sponsor = await Sponsor.findOne({ userId: _id })
      if (sponsor) {
        if (companyName)                 sponsor.companyName    = companyName
        if (industry)                    sponsor.industry       = industry
        if (phone)                       sponsor.phone          = phone
        if (streetAddress !== undefined) sponsor.streetAddress  = streetAddress
        if (city !== undefined)          sponsor.city           = city
        if (zipCode !== undefined)       sponsor.zipCode        = zipCode
        await sponsor.save()
      } else if (companyName && industry) {
        await Sponsor.create({ userId: _id, companyName, industry, phone: phone || user.phone, streetAddress, city, zipCode })
      }
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id:            user._id,
        firstName:      user.firstName,
        lastName:       user.lastName,
        email:          user.email,
        phone:          user.phone,
        avatar:         user.avatar,
        role:           user.role,
        twoFactor:      user.twoFactor,
        notifications:  user.notifications,
        paymentMethods: user.paymentMethods || [],
      },
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// ================= SECURITY =================
const updatePassword = async (req, res) => {
  const { _id } = req.user
  const { currentPassword, newPassword, confirmNewPassword } = req.body || {}

  try {
    if (!currentPassword || !newPassword || !confirmNewPassword) throw Error('All fields are required')
    if (newPassword !== confirmNewPassword) throw Error('New passwords do not match')

    const user = await User.findById(_id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) throw Error('Incorrect current password')

    const validator = require('validator')
    if (!validator.isStrongPassword(newPassword)) {
      throw Error('New password is not strong enough (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)')
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10
    const salt   = await bcrypt.genSalt(rounds)
    const hash   = await bcrypt.hash(newPassword, salt)

    user.password = hash
    await user.save()

    res.status(200).json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Update Password Error:', err.message)
    res.status(400).json({ error: err.message })
  }
}

// ================= FORGOT PASSWORD =================
function hashResetToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}
 
const forgotPassword = async (req, res) => {
  const { email } = req.body
 
  if (!email) {
    return res.status(400).json({ error: 'Please provide your email address' })
  }
 
  // Identical message for found/not-found — prevents email enumeration
  const SAFE_MSG = `If an account is associated with ${email}, a password reset link has been sent.`
 
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
 
    if (!user) {
      // Small artificial delay so timing attacks can't detect user existence
      await new Promise(r => setTimeout(r, 200 + Math.random() * 100))
      return res.status(200).json({ message: SAFE_MSG })
    }
 
    // 1. Generate a high-entropy raw token (256 bits)
    const rawToken  = crypto.randomBytes(32).toString('hex')        // ← 64-char hex, 256 bits
    const tokenHash = hashResetToken(rawToken)                      // ← only the hash is stored
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)        // ← 15-minute hard expiry
 
    // 2. Store hash + expiry — password is completely untouched
    user.passwordResetToken   = tokenHash
    user.passwordResetExpires = expiresAt
    // user.password             ← NOT touched at all
    await user.save()
 
    // 3. Build a one-time link with the raw token in the URL
    // Dynamically use the request's origin (so it works automatically when hosted online), falling back to CLIENT_URL
    const clientOrigin = req.headers.origin || (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : 'http://localhost:5173')
    const resetLink = `${clientOrigin}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`
 
    // 4. Send the link (not a password) in the email
    await sendEmail({
      to:      user.email,
      subject: 'Password Reset Request — eTicketsPro',
      text:    `Hello ${user.firstName || 'User'},\n\nClick the link below within 15 minutes to set a new password:\n${resetLink}\n\nIf you did not request this, your current password has NOT been changed.\n\nBest regards,\neTicketsPro Team`,
      html:    `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
          <div style="max-width:520px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden;">
            <div style="background:#1a1a2e; padding:24px; text-align:center;">
              <h2 style="color:#fff; margin:0;">eTicketsPro</h2>
            </div>
            <div style="padding:32px;">
              <h3 style="margin-top:0;">Password Reset Request</h3>
              <p>Hello <strong>${user.firstName || 'User'}</strong>,</p>
              <p>Click the button below — this link expires in <strong>15 minutes</strong>.</p>
              <div style="text-align:center; margin:32px 0;">
                <a href="${resetLink}"
                   style="background:#6c63ff; color:#fff; padding:14px 28px;
                          border-radius:6px; text-decoration:none; font-weight:bold;
                          display:inline-block;">
                  Reset My Password
                </a>
              </div>
              <p style="font-size:13px; color:#666;">
                If the button doesn't work, paste this URL into your browser:<br/>
                <a href="${resetLink}" style="color:#6c63ff; word-break:break-all;">${resetLink}</a>
              </p>
              <hr style="border:none; border-top:1px solid #eee; margin:24px 0;"/>
              <p style="font-size:12px; color:#999; margin:0;">
                If you did not request a password reset, you can safely ignore this email.
                Your current password has <strong>not</strong> been changed.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })
 
    // 5. Audit log
    const { ip, ua } = getClientMeta(req)
    await recordAuditLog({
      action:    'PASSWORD_RESET_REQUESTED',
      userId:    user._id,
      email:     user.email,
      firstName: user.firstName || '',
      lastName:  user.lastName  || '',
      role:      user.role      || '',
      ipAddress: ip,
      userAgent: ua,
      details:   'Password reset link generated and emailed',
    }).catch(e => console.error('AuditLog write error:', e.message))
 
    return res.status(200).json({ message: SAFE_MSG })
 
  } catch (err) {
    console.error('Forgot Password Error:', err.message)
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' })
  }
}

const resetPassword = async (req, res) => {
  const { token, email, newPassword, confirmNewPassword } = req.body || {}
 
  if (!token || !email || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ error: 'All fields are required' })
  }
 
  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ error: 'Passwords do not match' })
  }
 
  const validator = require('validator')
  if (!validator.isStrongPassword(newPassword)) {
    return res.status(400).json({
      error: 'Password is not strong enough (min 8 chars, uppercase, lowercase, number, symbol)',
    })
  }
 
  try {
    // 1. Hash the incoming raw token to compare against the stored hash
    const tokenHash = hashResetToken(token)
 
    // 2. Find user — token must match AND not be expired
    const user = await User.findOne({
      email:                email.toLowerCase().trim(),
      passwordResetToken:   tokenHash,
      passwordResetExpires: { $gt: new Date() },    // expiry enforced at DB level
    })
 
    if (!user) {
      // Covers: wrong token, wrong email, expired link
      return res.status(400).json({
        error: 'Reset link is invalid or has expired. Please request a new one.',
      })
    }
 
    // 3. Hash the new password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10
    const salt   = await bcrypt.genSalt(rounds)
    const hash   = await bcrypt.hash(newPassword, salt)
 
    // 4. Commit new password and burn the token (single-use)
    user.password             = hash
    user.passwordResetToken   = null   // ← burned — link can never be replayed
    user.passwordResetExpires = null
 
    // Step 27 compatibility: clear any active lockout
    user.failedLoginAttempts = 0
    user.lockedUntil         = null
 
    await user.save()
 
    // 5. Invalidate all active refresh tokens — forces re-login everywhere
    await RefreshToken.deleteMany({ userId: user._id })
 
    // 6. Audit log
    const { ip, ua } = getClientMeta(req)
    await recordAuditLog({
      action:    'PASSWORD_RESET_SUCCESS',
      userId:    user._id,
      email:     user.email,
      firstName: user.firstName || '',
      lastName:  user.lastName  || '',
      role:      user.role      || '',
      ipAddress: ip,
      userAgent: ua,
      details:   'Password successfully reset via email link',
    }).catch(e => console.error('AuditLog write error:', e.message))
 
    return res.status(200).json({
      message: 'Password reset successfully. You can now log in with your new password.',
    })
 
  } catch (err) {
    console.error('Reset Password Error:', err.message)
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' })
  }
}

module.exports = { signupUser, loginUser, refreshToken, logoutUser, getProfile, updateProfile, updatePassword, forgotPassword, resetPassword }