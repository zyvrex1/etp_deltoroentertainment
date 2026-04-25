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
    if (req.user.role === 'admin' && lowerRole === 'superadmin') {
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

    // ✅ 1. Create Base User (Includes phone/companyName because they are in your Schema)
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hash,
      role,
      phone,
      companyName,
    });

    // ✅ 2. Create Role-Specific Profile (For extra fields like 'industry')
    if (lowerRole === 'promoter') {
      await Promoter.create({ userId: newUser._id, phone, companyName, industry });
    } else if (lowerRole === 'sponsor') {
      await Sponsor.create({ userId: newUser._id, phone, companyName, industry });
    } else if (lowerRole === 'customer') {
      await Customer.create({ userId: newUser._id, phone });
    }

    // ✅ 3. Send email and create notifications
    try {
      await sendEmail({
        to: email,
        subject: 'Your new account',
        text: `Hello ${firstName}, Your account has been created. Temporary password: ${tempPassword}`
      });

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
        user: newUser // newUser now contains phone/companyName automatically
      });

    } catch (emailError) {
      console.error('Registration email failed to send:', emailError);
      return res.status(201).json({
        message: `${role} created successfully, but Welcome Email failed.`,
        user: newUser,
        temporaryPassword: tempPassword,
        warning: 'Could not send the welcome email due to server configuration.'
      });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const isRequesterAdmin = req.user.role === 'admin';

    // 1. Include phone and companyName in the selection
    const adminFilter = isRequesterAdmin 
      ? { role: { $ne: 'superadmin' } } 
      : {}; 
    
    const users = await User.find(adminFilter)
      .select('firstName lastName email role phone companyName lastLogin createdAt updatedAt avatar')
      .lean();

    // 2. Fetch all profile data (for extra fields like industry, tickets, etc.)
    const [customers, promoters, sponsors] = await Promise.all([
      Customer.find().lean(),
      Promoter.find().lean(),
      Sponsor.find().lean()
    ]);

    // 3. Create maps for quick lookup
    const profileMap = {};
    
    customers.forEach(c => {
      profileMap[c.userId.toString()] = { 
        type: 'customer', 
        details: { 
          ticketsPurchased: c.ticketsPurchased, 
          totalSpent: c.totalSpent 
        } 
      };
    });
    
    promoters.forEach(p => {
      profileMap[p.userId.toString()] = { 
        type: 'promoter', 
        details: { 
          industry: p.industry, 
          numberOfEvents: p.numberOfEvents 
        } 
      };
    });
    
    sponsors.forEach(s => {
      profileMap[s.userId.toString()] = { 
        type: 'sponsor', 
        details: { 
          industry: s.industry 
        } 
      };
    });

    // 4. Merge data
    const allUsers = users.map(u => {
      const profile = profileMap[u._id.toString()];
      
      return {
        ...u,
        // Basic phone/company info is now in the base object 'u'
        roleDetails: profile ? profile.details : {},
        roleType: profile ? profile.type : (['admin', 'superadmin'].includes(u.role) ? 'staff' : u.role)
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
    const { id } = req.params;

    // 1. Validate MongoDB ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // 2. Fetch User and include phone/companyName (exclude password)
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. RBAC Check: Admins cannot see superadmins
    if (req.user.role === 'admin' && user.role === 'superadmin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 4. Fetch Role-Specific Details (Profile logic)
    let roleDetails = {};
    const lowerRole = user.role.toLowerCase();

    if (lowerRole === 'promoter') {
      roleDetails = await Promoter.findOne({ userId: user._id }).lean();
    } else if (lowerRole === 'sponsor') {
      roleDetails = await Sponsor.findOne({ userId: user._id }).lean();
    } else if (lowerRole === 'customer') {
      roleDetails = await Customer.findOne({ userId: user._id }).lean();
    }

    // 5. Merge and Send
    // We combine the base user with the specific profile details (like industry)
    res.status(200).json({
      ...user.toObject(),
      roleDetails: roleDetails || {}
    });

  } catch (err) {
    console.error(`Error fetching user ${req.params.id}:`, err);
    res.status(500).json({ error: 'Server error' });
  }
};

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
