const User = require('../models/userModel')
const Settings = require('../models/settingsModel');
const bcrypt = require('bcryptjs');

// ✅ Get General Settings
const getSettings = async (req, res) => {
  const settings = await Settings.findOne();
  res.json(settings);
};

// ✅ Update General Settings
const updateGeneral = async (req, res) => {
  try {
    const { platformName, supportEmail, maintenanceMode } = req.body;

    const settings = await Settings.findOneAndUpdate(
      {},
      { platformName, supportEmail, maintenanceMode },
      { new: true, upsert: true }
    );

    res.json({ message: 'General settings updated', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Fees
const updateFees = async (req, res) => {
  try {
    const { platformFee, fixedFee, payoutSchedule } = req.body;

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        fees: {
          platformFee,
          fixedFee,
          payoutSchedule
        }
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Fees updated', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getSettings,
  updateGeneral,
  updateFees
};