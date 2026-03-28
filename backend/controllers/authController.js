const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

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
      message: 'User created successfully',
      email: user.email,
      role: user.role,
      token
    })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// ================= LOGIN =================
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields must be filled' });
  }

  try {
    const user = await User.login(email, password);

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
  const { firstName, lastName, email, phone, companyName, industry } = req.body

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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
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


module.exports = { signupUser, loginUser, getProfile, updateProfile, updatePassword }