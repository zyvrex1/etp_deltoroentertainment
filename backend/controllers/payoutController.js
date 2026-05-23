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

// Get payout history for a promoter
const getPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ promoterId: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json(payouts);
  } catch (error) {
    console.error('GET PAYOUTS ERROR:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPayout,
  getPayouts
};
