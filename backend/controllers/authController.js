const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

// Create JWT token
const createToken = (_id) => jwt.sign({ _id }, process.env.SECRET, { expiresIn: '3d' })

// ================= SIGNUP =================
const signupUser = async (req, res) => {
  const { role, email, password, confirmPassword, firstName, lastName, phone, companyName, industry } = req.body || {}

  try {
    if (!role || !email || !password || !confirmPassword) throw Error('Required fields missing')

    if (!['customer', 'sponsor'].includes(role)) throw Error('Invalid role for public signup')

    // Create user
    const user = await User.signup(email, password, confirmPassword, role)

    // Role-specific profile
    if (role === 'customer') {
      if (!firstName || !lastName || !phone) throw Error('Missing customer fields')
      await Customer.create({ user: user._id, firstName, lastName, phone, email })
    } else if (role === 'sponsor') {
      if (!firstName || !lastName || !phone || !companyName || !industry) throw Error('Missing sponsor fields')
      await Sponsor.create({ user: user._id, firstName, lastName, phone, companyName, industry, email })
    }

    const token = createToken(user._id)

    res.status(201).json({ message: 'User created successfully', email: user.email, role: user.role, token })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// ================= LOGIN =================
const loginUser = async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) throw Error('All fields must be filled')

    // Attempt to login
    const user = await User.login(email, password)
    const token = createToken(user._id)

    // Return user info including firstName and lastName
    res.status(200).json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token
    })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { signupUser, loginUser }