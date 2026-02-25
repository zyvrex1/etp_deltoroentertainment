// controllers/superadminController.js
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const validator = require('validator')

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body

    // Validate fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Only allow admin or promoter creation
    if (!['admin', 'promoter'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email is not valid' })
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ error: 'Password is not strong enough' })
    }

    const exists = await User.findOne({ email })
    if (exists) {
      return res.status(400).json({ error: 'Email already in use' })
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const newUser = await User.create({ firstName, lastName, email, password: hash, role })

    return res.status(201).json({ message: `${role} created successfully`, user: newUser })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { createUser }