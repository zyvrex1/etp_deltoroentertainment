const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { sendEmail } = require('../utils/email')

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, companyName, industry } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(tempPassword, salt);

    // ✅ 1. Create Base User (ONLY core fields)
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hash,
      role
    });

    // ✅ 2. Create Role-Specific Profile
    const lowerRole = role.toLowerCase();

    if (lowerRole === 'promoter') {
      await Promoter.create({
        userId: newUser._id,
        phone,
        companyName,
        industry
      });
    }

    if (lowerRole === 'sponsor') {
      await Sponsor.create({
        userId: newUser._id,
        phone,
        companyName,
        industry
      });
    }

    if (lowerRole === 'customer') {
      await Customer.create({
        userId: newUser._id,
        phone
      });
    }

    // ✅ 3. Send email
    await sendEmail({
      to: email,
      subject: 'Your new account',
      text: `Hello ${firstName},

Your account has been created.
Temporary password: ${tempPassword}

Please log in and change your password immediately.`
    });

    return res.status(201).json({
      message: `${role} created successfully.`,
      user: newUser
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createUser };

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

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Admin cannot delete superadmins
    if (req.user.role === 'admin' && user.role === 'superadmin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Admin can only delete promoter, sponsor, customer roles
    if (req.user.role === 'admin' && !['promoter', 'sponsor', 'customer'].includes(user.role)) {
      return res.status(403).json({ error: 'Admins cannot delete this role' })
    }

    await user.deleteOne()

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { createUser, getAllUsers, getUser, updateUser, deleteUser }
