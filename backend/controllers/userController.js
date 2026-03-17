const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// ------------------ Multer Setup ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
    cb(null, true);
  },
});

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      notifications: user.notifications,
      twoFactor: user.twoFactor,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check email uniqueness
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) throw new Error('Email already in use');
      user.email = email;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;

    // Handle avatar upload
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ------------------ Other Controllers ------------------
const updateSecurity = async (req, res) => {
  try {
    const { currentPassword, newPassword, twoFactor } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) throw new Error('User not found');

    // Only check current password if the user wants to change it
    if (newPassword) {
      if (!currentPassword) throw new Error('Current password is required');
      
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) throw new Error('Current password is incorrect');

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Optional: update two-factor if included
    if (typeof twoFactor === 'boolean') {
      user.twoFactor = twoFactor;
    }

    await user.save();

    res.status(200).json({ message: 'Security settings updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const { email, sms } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notifications: { email, sms } },
      { new: true }
    );
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserById,
  updateProfile,
  updateSecurity,
  updateNotifications,
  upload,
};