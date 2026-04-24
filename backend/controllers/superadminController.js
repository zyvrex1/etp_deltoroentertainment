const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { sendEmail } = require('../utils/email')
const { emitUpdate } = require('../socket')

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, phone, companyName, industry } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ error: 'First name, last name, email, and role are required' });
    }

    const lowerRole = role.toLowerCase();
    
    // Role-specific validation
    if (['promoter', 'sponsor', 'customer'].includes(lowerRole) && !phone) {
      return res.status(400).json({ error: 'Phone number is required for this role' });
    }
    if (['promoter', 'sponsor'].includes(lowerRole) && (!companyName || !industry)) {
      return res.status(400).json({ error: 'Company name and industry are required for this role' });
    }

    // Enforce role boundaries
    if (req.user.role === 'admin' && role.toLowerCase() === 'superadmin') {
      return res.status(403).json({ error: 'Admins cannot create Superadmin accounts' });
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

    // ✅ 3. Send email (Try-catch so registration doesn't fail if email fails)
    try {
      await sendEmail({
        to: email,
        subject: 'Your new account',
        text: `Hello ${firstName},

Your account has been created.
Temporary password: ${tempPassword}

Please log in and change your password immediately.`
      });

      // Create Notification and Emit
      const notificationController = require('./notificationController');
      const socket = require('../socket');
      const creatorName = `${req.user.firstName} ${req.user.lastName}`;
      
      const notification = await notificationController.createNotification({
        title: `${creatorName} created a new ${role}: ${firstName} ${lastName}`,
        content: `A new ${role} account has been registered.`,
        type: 'user',
        path: '/admin/users',
        unread: true,
        createdBy: req.user._id,
        targetRole: 'admin'
      });
      socket.emitUpdate('newNotification', notification);

      emitUpdate('dashboardUpdate');
      return res.status(201).json({
        message: `${role} created successfully and email sent.`,
        user: newUser
      });

    } catch (emailError) {
      console.error('Registration email failed to send:', emailError);
      return res.status(201).json({
        message: `${role} created successfully, but Welcome Email failed.`,
        user: newUser,
        temporaryPassword: tempPassword, // Fallback so admin can give it manually
        warning: 'Could not send the welcome email due to server configuration.'
      });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createUser };

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const isRequesterAdmin = req.user.role === 'admin';

    // 1. Fetch all users based on role boundaries
    const adminFilter = isRequesterAdmin 
      ? { role: { $ne: 'superadmin' } } 
      : {}; // Superadmin can see everyone
    
    const users = await User.find(adminFilter)
      .select('firstName lastName email role lastLogin createdAt updatedAt avatar')
      .lean();

    // 2. Fetch all profile data
    const [customers, promoters, sponsors] = await Promise.all([
      Customer.find().lean(),
      Promoter.find().lean(),
      Sponsor.find().lean()
    ]);

    // 3. Create maps for quick lookup to avoid O(n^2) merging
    const profileMap = {};
    
    customers.forEach(c => {
      profileMap[c.userId.toString()] = { 
        type: 'customer', 
        details: { phone: c.phone, ticketsPurchased: c.ticketsPurchased, totalSpent: c.totalSpent } 
      };
    });
    
    promoters.forEach(p => {
      profileMap[p.userId.toString()] = { 
        type: 'promoter', 
        details: { phone: p.phone, companyName: p.companyName, industry: p.industry, numberOfEvents: p.numberOfEvents } 
      };
    });
    
    sponsors.forEach(s => {
      profileMap[s.userId.toString()] = { 
        type: 'sponsor', 
        details: { phone: s.phone, companyName: s.companyName, industry: s.industry } 
      };
    });

    // 4. Merge data into a unique user list
    const allUsers = users.map(u => {
      const profile = profileMap[u._id.toString()];
      return {
        ...u,
        roleDetails: profile ? profile.details : {},
        // If they have a profile, use that type, otherwise use their base role
        roleType: profile ? profile.type : (['admin', 'superadmin'].includes(u.role) ? 'admin' : 'unknown')
      };
    });

    res.status(200).json(allUsers);
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    res.status(500).json({ error: 'Server error', details: err.message });
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
    emitUpdate('dashboardUpdate');

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
    emitUpdate('dashboardUpdate');

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}

module.exports = { createUser, getAllUsers, getUser, updateUser, deleteUser }
