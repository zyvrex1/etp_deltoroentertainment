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
  // fallback to empty object if req.body is undefined
  const {
    role,
    email,
    password,
    confirmPassword,
    fullName,
    phone,
    bankAcc,
    profilePicture,
    companyName,
    industry
  } = req.body || {}

  try {
    if (!role || !email || !password || !confirmPassword) throw Error('Required fields missing')

    // Create user
    const user = await User.signup(email, password, confirmPassword, role)

    // Create role-specific profile
    if (role === 'promoter') {
      if (!fullName || !phone || !bankAcc) throw Error('Missing promoter fields')
      await Promoter.create({ user: user._id, fullName, phone, bankAcc })
    } else if (role === 'sponsor') {
      if (!fullName || !phone || !companyName || !industry) throw Error('Missing sponsor fields')
      await Sponsor.create({ user: user._id, fullName, phone, companyName, industry, profilePicture })
    } else if (role === 'customer') {
      if (!fullName || !phone) throw Error('Missing customer fields')
      await Customer.create({ user: user._id, fullName, phone })
    }

    const token = createToken(user._id)

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
  const { email, password } = req.body

  try {
    if (!email || !password) throw Error('All fields must be filled')

    const user = await User.login(email, password)
    const token = createToken(user._id)

    res.status(200).json({
      email: user.email,
      role: user.role,
      token
    })

  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { signupUser, loginUser }