const Payout = require('../models/payoutModel');
const mongoose = require('mongoose');

// Create a new payout request
const createPayout = async (req, res) => {
  const { amount, method, methodDetails, reference, eventIds } = req.body;

  try {
    const payout = await Payout.create({
      promoterId: req.user._id,
      amount,
      method,
      methodDetails,
      reference: reference || `WTD-${Math.floor(Math.random() * 10000000)}`,
      eventIds,
      status: 'pending'
    });

    res.status(201).json(payout);
  } catch (error) {
    console.error('CREATE PAYOUT ERROR:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get payouts (All for admin, only own for promoter)
const getPayouts = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query = { promoterId: req.user._id };
    }

    const payouts = await Payout.find(query)
      .populate('promoterId', 'firstName lastName companyName')
      .populate('eventIds', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json(payouts);
  } catch (error) {
    console.error('GET PAYOUTS ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update payout status (Admin only)
const updatePayoutStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only admins can update payout status' });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such payout' });
  }

  try {
    const payout = await Payout.findOneAndUpdate(
      { _id: id },
      { status, rejectionReason },
      { new: true }
    ).populate('promoterId', 'firstName lastName companyName')
     .populate('eventIds', 'title');

    if (!payout) {
      return res.status(404).json({ error: 'No such payout' });
    }

    res.status(200).json(payout);
  } catch (error) {
    console.error('UPDATE PAYOUT STATUS ERROR:', error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createPayout,
  getPayouts,
  updatePayoutStatus
};
