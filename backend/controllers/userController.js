const User = require('../models/userModel');
const Promoter = require('../models/promoterModel');
const Sponsor = require('../models/sponsorModel');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { optimizeImageBuffer } = require("../utils/imageOptimizer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/s3Client");
const { v4: uuidv4 } = require("uuid");

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
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
    console.log("--- UPDATE PROFILE DEBUG ---");
    console.log("Body:", req.body);
    const { firstName, lastName, email, phone, companyName, industry, description, streetAddress, city, zipCode } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check email uniqueness
    if (email && email !== user.email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (exists) throw new Error('Email already in use');
      user.email = email;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    if (companyName) user.companyName = companyName;
    if (industry) user.industry = industry;
    if (description) user.description = description;

    // Update notifications if provided
    if (req.body.notifications) {
      try {
        const notifs = typeof req.body.notifications === 'string'
          ? JSON.parse(req.body.notifications)
          : req.body.notifications;
        user.notifications = {
          ...user.notifications?.toObject?.() || user.notifications,
          ...notifs
        };
      } catch (err) {
        console.error("Error updating notifications:", err);
      }
    }

    // Update paymentMethods if provided
    if (req.body.paymentMethods) {
      try {
        const pMethods = typeof req.body.paymentMethods === 'string'
          ? JSON.parse(req.body.paymentMethods)
          : req.body.paymentMethods;
        user.paymentMethods = pMethods;
      } catch (err) {
        console.error("Error updating paymentMethods:", err);
      }
    }

    // Handle avatar upload
    if (req.file) {
  const { buffer, contentType, ext } = await optimizeImageBuffer(
    req.file.buffer, req.file.mimetype, 75, 400
  );
  const key = `avatars/${uuidv4()}${ext}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  user.avatar = `${process.env.CDN_BASE_URL}/${key}`;
}

    await user.save();

    let fullProfileData = user.toObject();
    delete fullProfileData.password;

    // Update promoter-specific fields
    if (user.role === 'promoter') {
      const promoter = await Promoter.findOne({ userId: user._id });
      if (promoter) {
        if (companyName) promoter.companyName = companyName;
        if (industry) promoter.industry = industry;
        if (phone) promoter.phone = phone;
        await promoter.save();
        fullProfileData.industry = promoter.industry;
        fullProfileData.companyName = promoter.companyName;
      }
    }

    // Update sponsor-specific fields
    if (user.role === 'sponsor') {
      const sponsor = await Sponsor.findOne({ userId: user._id });
      if (sponsor) {
        if (companyName) sponsor.companyName = companyName;
        if (industry) sponsor.industry = industry;
        if (phone) sponsor.phone = phone;
        if (streetAddress !== undefined) sponsor.streetAddress = streetAddress;
        if (city !== undefined) sponsor.city = city;
        if (zipCode !== undefined) sponsor.zipCode = zipCode;
        await sponsor.save();
        fullProfileData.industry = sponsor.industry;
        fullProfileData.companyName = sponsor.companyName;
        fullProfileData.streetAddress = sponsor.streetAddress;
        fullProfileData.city = sponsor.city;
        fullProfileData.zipCode = sponsor.zipCode;
      }
    }

    res.status(200).json(fullProfileData);
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

// ✅ Get Admin Payment Methods
const getAdminPaymentMethods = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(admin.paymentMethods || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPromoters = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'promoter' };

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const promoters = await User.find(query).select('firstName lastName email avatar').limit(10);
    res.json(promoters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSponsors = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'sponsor' }; // Restrict searching to only sponsor accounts

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const sponsors = await User.find(query).select('firstName lastName email avatar role').limit(10);
    res.json(sponsors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { emitUpdate } = require('../socket');

const updateCart = async (req, res) => {
  try {
    const { cart } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { cart },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Broadcast cart update to all connected clients
    // Clients will filter by userId to see if it applies to them
    emitUpdate('cartUpdate', { userId: user._id, cart: user.cart });
    
    res.status(200).json(user.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addPaymentMethod = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newMethod = req.body;
    
    // If this is the first method, or requested to be default, set it as default and unset others
    if (user.paymentMethods.length === 0 || newMethod.isDefault) {
      newMethod.isDefault = true;
      user.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
    } else {
      newMethod.isDefault = false;
    }

    user.paymentMethods.push(newMethod);
    await user.save();
    
    res.status(200).json(user.paymentMethods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const removePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.paymentMethods = user.paymentMethods.filter(method => method._id.toString() !== methodId);
    
    // If the default method was removed, make the first remaining method default
    if (user.paymentMethods.length > 0 && !user.paymentMethods.some(m => m.isDefault)) {
      user.paymentMethods[0].isDefault = true;
    }

    await user.save();
    res.status(200).json(user.paymentMethods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.paymentMethods.forEach(method => {
      method.isDefault = (method._id.toString() === methodId);
    });

    await user.save();
    res.status(200).json(user.paymentMethods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserById,
  updateProfile,
  updateSecurity,
  updateNotifications,
  getAdminPaymentMethods,
  getPromoters,
  getSponsors,
  updateCart,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  upload,
};