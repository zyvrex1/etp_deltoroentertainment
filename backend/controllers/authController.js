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
  const accessToken   = createAccessToken(user)
  const rawRefresh    = createRefreshToken(user)
  const tokenHash     = hashToken(rawRefresh)
  const tokenFamily   = family || crypto.randomUUID()

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
      token:     accessToken,        // short-lived access token only
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
      token:          accessToken,         // short-lived access token only
    })

  } catch (err) {
    console.error('Login error:', err.message, 'for email:', email)

    try {
      const existingUser = await User
        .findOne({ email: email.toLowerCase().trim() })
        .lean()
        .catch(() => null)

      await recordAuditLog({
        action:    'LOGIN_FAILED',
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

    return res.status(401).json({ error: err.message })
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

  // ✅ audit trail consistent with LOGIN_SUCCESS / LOGIN_FAILED
  try {
    const { ip, ua } = getClientMeta(req)
    const userId = req.user?._id || null  // may be absent if access token already expired

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
        profileData.companyName    = sponsor.companyName
        profileData.industry       = sponsor.industry
        if (sponsor.phone) profileData.phone = sponsor.phone
        profileData.streetAddress  = sponsor.streetAddress
        profileData.city           = sponsor.city
        profileData.zipCode        = sponsor.zipCode
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
        if (companyName)              sponsor.companyName    = companyName
        if (industry)                 sponsor.industry       = industry
        if (phone)                    sponsor.phone          = phone
        if (streetAddress !== undefined) sponsor.streetAddress = streetAddress
        if (city !== undefined)       sponsor.city           = city
        if (zipCode !== undefined)    sponsor.zipCode        = zipCode
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
const forgotPassword = async (req, res) => {
  const { email } = req.body

  if (!email) return res.status(400).json({ error: 'Please provide your email address' })

  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(200).json({ message: `If an account is associated with ${email}, a temporary password has been sent.` })
    }

    const tempPassword = crypto.randomBytes(4).toString('hex')

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10
    const salt   = await bcrypt.genSalt(rounds)
    const hash   = await bcrypt.hash(tempPassword, salt)

    user.password = hash
    await user.save()

    await sendEmail({
      to:      email,
      subject: 'Temporary Password - eTicketsPro',
      text:    `Hello ${user.firstName || 'User'},\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and change your password immediately.\n\nBest regards,\neTicketsPro Team`,
      html:    `
        <h3>Hello ${user.firstName || 'User'},</h3>
        <p>Your temporary password is: <strong>${tempPassword}</strong></p>
        <p>Please log in and change your password immediately for security reasons.</p>
        <br/>
        <p>Best regards,<br/>eTicketsPro Team</p>
      `,
    })

    res.status(200).json({ message: `A temporary password has been sent to ${email}` })
  } catch (err) {
    console.error('Forgot Password Error:', err.message)
    res.status(500).json({ error: 'Something went wrong while resetting your password.' })
  }
}

module.exports = { signupUser, loginUser, refreshToken, logoutUser, getProfile, updateProfile, updatePassword, forgotPassword }