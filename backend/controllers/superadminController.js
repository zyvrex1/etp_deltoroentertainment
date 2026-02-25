const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const validator = require('validator')

// Create user (used by both superadmin and admin routes)
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body

    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Role-based restriction
    if (req.user.role === 'admin') {
      if (!['promoter', 'sponsor', 'customer'].includes(role)) {
        return res.status(403).json({ error: 'Admins cannot create this role' })
      }
    } else if (req.user.role === 'superadmin') {
      if (!['superadmin', 'admin', 'promoter', 'sponsor', 'customer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' })
      }
    } else {
      return res.status(403).json({ error: 'Access denied' })
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

// Get all users
const getAllUsers = async (req, res) => {
  try {
    let query = {}

    if (req.user.role === 'admin') {
      // Admin cannot see superadmins
      query.role = { $ne: 'superadmin' }
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 })
    res.status(200).json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

// Get single user
const getUser = async (req, res) => {
  try {
    const { id } = req.params

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const user = await User.findById(id).select('-password')
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Admin cannot see superadmins
    if (req.user.role === 'admin' && user.role === 'superadmin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.status(200).json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, role } = req.body

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Admin cannot update superadmins
    if (req.user.role === 'admin' && user.role === 'superadmin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Admin can only update promoter, sponsor, customer roles
    if (req.user.role === 'admin' && role && !['promoter', 'sponsor', 'customer'].includes(role)) {
      return res.status(403).json({ error: 'Admins cannot assign this role' })
    }

    // Superadmin can update any user
    if (req.user.role === 'superadmin' && role && !['superadmin', 'admin', 'promoter', 'sponsor', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    // Update fields if provided
    if (firstName) user.firstName = firstName
    if (lastName) user.lastName = lastName
    if (email) user.email = email
    if (role) user.role = role

    await user.save()

    res.status(200).json({ message: 'User updated successfully', user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { createUser, getAllUsers, getUser, updateUser, }
