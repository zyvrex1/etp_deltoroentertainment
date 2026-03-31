const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { sendEmail } = require('../utils/email')
const crypto = require('crypto')

// Create JWT token
const createToken = (user) => {
  return jwt.sign(
    { _id: user._id, role: user.role },
    process.env.SECRET,
    { expiresIn: '3d' }
  );
};

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
    }

    const token = createToken(user)

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

  try {
    const user = await User.login(email, password);

    // Role verification
    if (role && user.role !== role) {
      throw Error(`Unauthorized. This account is registered as a ${user.role}.`);
    }

    const token = createToken(user);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      twoFactor: user.twoFactor,
      notifications: user.notifications,
      token
    });

  } catch (err) {
    console.error('Login error:', err.message, 'for email:', email);
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
      role: user.role,
      avatar: user.avatar,
      notifications: user.notifications,
      twoFactor: user.twoFactor
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

    res.status(200).json(profileData)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const updateProfile = async (req, res) => {
  const { _id } = req.user
  const { firstName, lastName, email, phone, companyName, industry, avatar } = req.body

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
        notifications: user.notifications
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

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(newPassword, salt)

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
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(tempPassword, salt);

    // Update user's password in database
    user.password = hash;
    await user.save();

    // Send the email
    await sendEmail({
      to: email,
      subject: 'Temporary Password - eTicketsPro',
      text: `Hello ${user.firstName || 'User'},\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and change your password immediately for security reasons.\n\nBest regards,\neTicketsPro Team`,
      html: `
        <h3>Hello ${user.firstName || 'User'},</h3>
        <p>Your temporary password is: <strong>${tempPassword}</strong></p>
        <p>Please log in and change your password immediately for security reasons.</p>
        <br/>
        <p>Best regards,<br/>eTicketsPro Team</p>
      `
    });

    res.status(200).json({ message: `A temporary password has been sent to ${email}` });

  } catch (err) {
    console.error('Forgot Password Error:', err.message);
    res.status(500).json({ error: 'Something went wrong while resetting your password.' });
  }
};


module.exports = { signupUser, loginUser, getProfile, updateProfile, updatePassword, forgotPassword }