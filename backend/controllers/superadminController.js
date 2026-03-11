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
    // Admin cannot see superadmins
    let usersQuery = {};
    if (req.user.role === 'admin') {
      usersQuery.role = { $ne: 'superadmin' };
    }

    // Fetch all role documents
    const customers = await Customer.find().populate('userId', 'firstName lastName email role lastLogin createdAt updatedAt');
    const promoters = await Promoter.find().populate('userId', 'firstName lastName email role lastLogin createdAt updatedAt');
    const sponsors = await Sponsor.find().populate('userId', 'firstName lastName email role lastLogin createdAt updatedAt');
    
    // Fetch admins (excluding superadmins if current user is admin)
    const adminFilter = req.user.role === 'admin' ? { role: 'admin' } : { role: { $in: ['admin', 'superadmin'] } };
    const admins = await User.find(adminFilter).select('firstName lastName email role lastLogin createdAt updatedAt');

    // Merge into one array
    const allUsers = [
      ...customers.map(c => ({
        _id: c.userId._id,
        firstName: c.userId.firstName,
        lastName: c.userId.lastName,
        email: c.userId.email,
        role: c.userId.role,
        lastLogin: c.userId.lastLogin,
        createdAt: c.userId.createdAt,
        updatedAt: c.userId.updatedAt,
        roleDetails: { phone: c.phone, ticketsPurchased: c.ticketsPurchased, totalSpent: c.totalSpent },
        roleType: 'customer'
      })),
      ...promoters.map(p => ({
        _id: p.userId._id,
        firstName: p.userId.firstName,
        lastName: p.userId.lastName,
        email: p.userId.email,
        role: p.userId.role,
        lastLogin: p.userId.lastLogin,
        createdAt: p.userId.createdAt,
        updatedAt: p.userId.updatedAt,
        roleDetails: { phone: p.phone, companyName: p.companyName, industry: p.industry, numberOfEvents: p.numberOfEvents },
        roleType: 'promoter'
      })),
      ...sponsors.map(s => ({
        _id: s.userId._id,
        firstName: s.userId.firstName,
        lastName: s.userId.lastName,
        email: s.userId.email,
        role: s.userId.role,
        lastLogin: s.userId.lastLogin,
        createdAt: s.userId.createdAt,
        updatedAt: s.userId.updatedAt,
        roleDetails: { phone: s.phone, companyName: s.companyName, industry: s.industry },
        roleType: 'sponsor'
      })),
      ...admins.map(a => ({
        _id: a._id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        role: a.role,
        lastLogin: a.lastLogin,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        roleDetails: {},
        roleType: 'admin'
      }))
    ];

    res.status(200).json(allUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

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
