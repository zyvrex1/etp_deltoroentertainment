const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { sendEmail } = require('../utils/email')
const crypto = require('crypto')
const { emitUpdate } = require('../socket')
const { recordAuditLog, emitAuditSocketEvents } = require('./auditlogController')
const { getJwtSecret } = require('../utils/jwt')

const createToken = (user) => {
  return jwt.sign(
    { _id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '3d' }
  )
}

// ================= SIGNUP =================
const signupUser = async (req, res) => {
  const { role, email, password, confirmPassword, firstName, lastName, phone, companyName, industry } = req.body || {}

  try {
    if (!role || !email || !password || !confirmPassword) throw Error('Required fields missing')
    if (!['customer', 'sponsor'].includes(role)) throw Error('Invalid role for public signup')

    const user = await User.signup(
      email,
      password,
      confirmPassword,
      role,
      firstName,
      lastName
    )

    // Save phone
    user.phone = phone || ''
    await user.save()

    if (role === 'customer') {
      if (!firstName || !lastName || !phone) throw Error('Missing customer fields')
      await Customer.create({ userId: user._id, phone })
    }

    if (role === 'sponsor') {
      if (!firstName || !lastName || !phone || !companyName || !industry) throw Error('Missing sponsor fields')
      await Sponsor.create({ userId: user._id, phone, companyName, industry })

      // Create Notification for admin
      const notificationController = require('./notificationController');
      const notification = await notificationController.createNotification({
        title: `New sponsor registered: ${firstName} ${lastName}`,
        content: `from ${companyName}`,
        type: 'user',
        path: '/admin/users',
        unread: true,
        createdBy: user._id,
        targetRole: 'admin'
      });
      emitUpdate('newNotification', notification);

      // Also notify the sponsor themselves of successful registration
      const selfNotification = await notificationController.createNotification({
        title: `Welcome to eTicketsPro!`,
        content: `Your sponsor account has been successfully created.`,
        type: 'user',
        path: '/sponsor/settings',
        unread: true,
        userId: user._id,
        createdBy: user._id
      });
      emitUpdate('newNotification', selfNotification);
    }

const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      '';
    const ua = req.headers['user-agent'] || '';

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
      });
    } catch (e) {
      console.error('AuditLog write error:', e.message);
      emitAuditSocketEvents('USER_SIGNUP');
    }

    const token = createToken(user)
    emitUpdate('dashboardUpdate');
    
    res.status(201).json({
      _id: user._id,
      message: 'User created successfully',
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      token
    })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// ================= LOGIN =================
const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields must be filled' });
  }

  // Grab real IP even behind a proxy
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '';
  const ua = req.headers['user-agent'] || '';

  try {
    const user = await User.login(email, password);

    // Role verification
    if (role && user.role !== role) {
      throw Error(`Unauthorized. This account is registered as a ${user.role}.`);
    }

    const token = createToken(user);

    user.lastLogin = new Date();
    await user.save();

    // ✅ Record successful login
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
    });

    res.status(200).json({
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
      token,
    });

  } catch (err) {
    console.error('Login error:', err.message, 'for email:', email);

    // ❌ Record failed login attempt — always emit socket events even if DB write fails
    try {
      const existingUser = await User
        .findOne({ email: email.toLowerCase().trim() })
        .lean()
        .catch(() => null);

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
      });
    } catch (auditErr) {
      console.error('AuditLog write error:', auditErr.message);
      emitAuditSocketEvents('LOGIN_FAILED');
    }

    res.status(401).json({ error: err.message });
  }
};


// ================= PROFILE =================
const getProfile = async (req, res) => {
  const { _id } = req.user

  try {
    const user = await User.findById(_id).select('-password')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    let profileData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      notifications: user.notifications,
      twoFactor: user.twoFactor,
      cart: user.cart || [],
      paymentMethods: user.paymentMethods || []
    }

    // Attach promoter-specific data if needed
    if (user.role === 'promoter') {
      const promoter = await Promoter.findOne({ userId: _id })
      if (promoter) {
        profileData.companyName = promoter.companyName
        profileData.industry = promoter.industry
        // Pull phone from promoter record if available (source of truth for promoters)
        if (promoter.phone) profileData.phone = promoter.phone
      }
    }

    // 🔥 Attach sponsor-specific data if needed
    if (user.role === 'sponsor') {
      const sponsor = await Sponsor.findOne({ userId: _id })
      if (sponsor) {
        profileData.companyName = sponsor.companyName
        profileData.industry = sponsor.industry
        if (sponsor.phone) profileData.phone = sponsor.phone
        profileData.streetAddress = sponsor.streetAddress
        profileData.city = sponsor.city
        profileData.zipCode = sponsor.zipCode
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
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update user generic fields
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
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
        ...notifications
      }
    }

    await user.save()

    // Update promoter-specific fields if applicable
    if (user.role === 'promoter') {
      const promoter = await Promoter.findOne({ userId: _id })
      if (promoter) {
        if (companyName) promoter.companyName = companyName
        if (industry) promoter.industry = industry
        if (phone) promoter.phone = phone
        await promoter.save()
      }
    }

    // 🔥 Update sponsor-specific fields if applicable
    if (user.role === 'sponsor') {
      let sponsor = await Sponsor.findOne({ userId: _id })

      if (sponsor) {
        if (companyName) sponsor.companyName = companyName
        if (industry) sponsor.industry = industry
        if (phone) sponsor.phone = phone
        if (streetAddress !== undefined) sponsor.streetAddress = streetAddress
        if (city !== undefined) sponsor.city = city
        if (zipCode !== undefined) sponsor.zipCode = zipCode
        await sponsor.save()
      } else if (companyName && industry) {
        // Create it if it doesn't exist yet but form data is provided
        await Sponsor.create({
          userId: _id,
          companyName,
          industry,
          phone: phone || user.phone,
          streetAddress,
          city,
          zipCode
        })
      }
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        twoFactor: user.twoFactor,
        notifications: user.notifications,
        paymentMethods: user.paymentMethods || []
      }
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
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw Error('All fields are required')
    }

    if (newPassword !== confirmNewPassword) {
      throw Error('New passwords do not match')
    }

    const user = await User.findById(_id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) {
      throw Error('Incorrect current password')
    }

    // Check if new password is strong
    const validator = require('validator') // Keeping it here is fine too but I'll add a log
    if (!validator.isStrongPassword(newPassword)) {
      throw Error('New password is not strong enough (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)')
    }

//     const salt = await bcrypt.genSalt(10)
//     const hash = await bcrypt.hash(newPassword, salt)

//     user.password = hash
//     await user.save()

//     res.status(200).json({ message: 'Password updated successfully' })
//   } catch (err) {
//     console.error('Update Password Error:', err.message)
//     res.status(400).json({ error: err.message })
//   }
// }

 // CHANGED: hardcoded genSalt(10) → reads BCRYPT_ROUNDS from .env
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
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please provide your email address' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      // For security reasons, don't reveal if a user exists or not
      return res.status(200).json({ message: `If an account is associated with ${email}, a temporary password has been sent.` });
    }

    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

    // Hash the temporary password
  //   const salt = await bcrypt.genSalt(10);
  //   const hash = await bcrypt.hash(tempPassword, salt);

  //   // Update user's password in database
  //   user.password = hash;
  //   await user.save();

  //   // Send the email
  //   await sendEmail({
  //     to: email,
  //     subject: 'Temporary Password - eTicketsPro',
  //     text: `Hello ${user.firstName || 'User'},\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and change your password immediately for security reasons.\n\nBest regards,\neTicketsPro Team`,
  //     html: `
  //       <h3>Hello ${user.firstName || 'User'},</h3>
  //       <p>Your temporary password is: <strong>${tempPassword}</strong></p>
  //       <p>Please log in and change your password immediately for security reasons.</p>
  //       <br/>
  //       <p>Best regards,<br/>eTicketsPro Team</p>
  //     `
  //   });

  //   res.status(200).json({ message: `A temporary password has been sent to ${email}` });

  // } catch (err) {
  //   console.error('Forgot Password Error:', err.message);
  //   res.status(500).json({ error: 'Something went wrong while resetting your password.' }
   // CHANGED: hardcoded genSalt(10) → reads BCRYPT_ROUNDS from .env
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
      `
    })
 
    res.status(200).json({ message: `A temporary password has been sent to ${email}` })
 
  } catch (err) {
    console.error('Forgot Password Error:', err.message)
    res.status(500).json({ error: 'Something went wrong while resetting your password.' })
  }
}


module.exports = { signupUser, loginUser, getProfile, updateProfile, updatePassword, forgotPassword }