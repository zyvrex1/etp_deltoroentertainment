const User = require('../models/userModel')
const Promoter = require('../models/promoterModel')
const Sponsor = require('../models/sponsorModel')
const Customer = require('../models/customerModel')
const Reservation = require('../models/reservationModel')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { sendEmail } = require('../utils/email')
const { emitUpdate } = require('../socket')
const { recordAuditLog } = require('./auditlogController')

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
      
      await recordAuditLog({
        action:    'USER_CREATED',
        userId:    newUser._id,
        email:     newUser.email,
        firstName: newUser.firstName || '',
        lastName:  newUser.lastName  || '',
        role:      newUser.role      || '',
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        details:   `Account manually created by ${req.user?.role} (${req.user?.email})`,
      }).catch(e => console.error('AuditLog write error:', e.message));

      return res.status(201).json({
        message: `${role} created successfully and email sent.`,
        user: newUser
      });

    } catch (emailError) {
      console.error('Registration email failed to send:', emailError);
      
      await recordAuditLog({
        action:    'USER_CREATED',
        userId:    newUser._id,
        email:     newUser.email,
        firstName: newUser.firstName || '',
        lastName:  newUser.lastName  || '',
        role:      newUser.role      || '',
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        details:   `Account manually created by ${req.user?.role} (${req.user?.email}) — welcome email failed`,
      }).catch(e => console.error('AuditLog write error:', e.message));

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
    const { page, limit, skip } = req.pagination || { page: 1, limit: 10, skip: 0 };
    const search = (req.query.search || '').trim();
    const roleFilter = req.query.role || 'all-users';

    // 1. Build Filter for Paginated Query
    const filter = { _id: { $ne: req.user._id } }; // Exclude current user
    if (isRequesterAdmin) {
      filter.role = { $ne: 'superadmin' };
    }

    if (roleFilter !== 'all-users') {
       const roleMap = { admins: 'admin', promoters: 'promoter', sponsors: 'sponsor', customers: 'customer' };
       if (roleMap[roleFilter]) {
           // If they are an admin, ensure they still can't query superadmin via roleFilter
           if (isRequesterAdmin && roleMap[roleFilter] === 'superadmin') {
             filter.role = 'none'; // invalid filter
           } else {
             filter.role = roleMap[roleFilter];
           }
       }
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Fetch counts for tabs (unaffected by search)
    const countFilter = isRequesterAdmin ? { role: { $ne: 'superadmin' }, _id: { $ne: req.user._id } } : { _id: { $ne: req.user._id } };
    
    const roleCountsAggr = await User.aggregate([
       { $match: countFilter },
       { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    
    let totalUsersCount = 0;
    const counts = { admins: 0, promoters: 0, sponsors: 0, customers: 0, all: 0 };
    roleCountsAggr.forEach(r => {
        if (r._id === 'admin') counts.admins = r.count;
        if (r._id === 'promoter') counts.promoters = r.count;
        if (r._id === 'sponsor') counts.sponsors = r.count;
        if (r._id === 'customer') counts.customers = r.count;
        totalUsersCount += r.count;
    });
    counts.all = totalUsersCount;

    // 3. Fetch Paginated Users
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('firstName lastName email role phone companyName lastLogin createdAt updatedAt avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    // 4. Fetch profile data ONLY for the users on the current page
    const userIds = users.map(u => u._id);
    
    const [customers, promoters, sponsors, sponsorStats] = await Promise.all([
      Customer.find({ userId: { $in: userIds } }).lean(),
      Promoter.find({ userId: { $in: userIds } }).lean(),
      Sponsor.find({ userId: { $in: userIds } }).lean(),
      Reservation.aggregate([
        { $match: { user: { $in: userIds }, status: 'confirmed' } },
        { $group: { 
            _id: '$user', 
            totalSpent: { $sum: '$amount.total' },
            boothsBooked: { $sum: 1 }
        }}
      ])
    ]);
    
    const sponsorStatsMap = {};
    sponsorStats.forEach(s => {
      sponsorStatsMap[s._id.toString()] = {
        totalSpent: s.totalSpent,
        boothsBooked: s.boothsBooked
      };
    });

    // 5. Create maps for quick lookup
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
      const stats = sponsorStatsMap[s.userId.toString()] || { totalSpent: 0, boothsBooked: 0 };
      profileMap[s.userId.toString()] = { 
        type: 'sponsor', 
        details: { 
          industry: s.industry,
          totalSpent: stats.totalSpent,
          boothsBooked: stats.boothsBooked
        } 
      };
    });

    // 6. Merge data
    const allUsers = users.map(u => {
      const profile = profileMap[u._id.toString()];
      
      return {
        ...u,
        roleDetails: profile ? profile.details : {},
        roleType: profile ? profile.type : (['admin', 'superadmin'].includes(u.role) ? 'staff' : u.role)
      };
    });

    res.status(200).json({
      data: allUsers,
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
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
      const [sponsor, reservations] = await Promise.all([
        Sponsor.findOne({ userId: user._id }).lean(),
        Reservation.find({ user: user._id, status: 'confirmed' }).lean()
      ]);
      
      const totalSpent = reservations.reduce((sum, r) => sum + (r.amount?.total || 0), 0);
      const boothsBooked = reservations.length;
      
      roleDetails = sponsor ? { 
        ...sponsor, 
        totalSpent, 
        boothsBooked 
      } : {};
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
    if (req.body.companyName) user.companyName = req.body.companyName
    if (req.body.phone) user.phone = req.body.phone

    let passwordUpdated = false;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
      passwordUpdated = true;
    }

    await user.save()
    emitUpdate('dashboardUpdate');

    if (passwordUpdated) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Your Password Has Been Updated',
          text: `Hello ${user.firstName}, \n\nAn administrator has updated your password. \n\nYour new temporary password is: ${req.body.password} \n\nPlease log in and change your password as soon as possible for security reasons. \n\nBest regards, \nThe eTicketsPro Team`
        });
        return res.status(200).json({ message: 'User updated and password email sent', user })
      } catch (emailError) {
        console.error('Password update email failed:', emailError);
        return res.status(200).json({ 
          message: 'User updated successfully, but password email failed to send.', 
          user,
          warning: 'Could not send the password notification email.' 
        })
      }
    }

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
