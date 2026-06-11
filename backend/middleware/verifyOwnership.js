const Reservation = require('../models/reservationModel');
const Order       = require('../models/orderModel');
const Payout      = require('../models/payoutModel');

const isSameUser = (a, b) => a.toString() === b.toString();

// Both admin and superadmin bypass ownership checks.
// If you want only superadmin to bypass, change this to:
//   u.role === 'superadmin'
const isAdmin = (u) => u.role === 'superadmin' || u.role === 'admin';

// Booth / seat reservation → owner field: reservation.user
const verifyReservationOwner = async (req, res, next) => {
  try {
    const doc = await Reservation
      .findById(req.params.id).select('user');

    if (!doc) return res.status(404)
      .json({ message: 'Reservation not found.' });

    // Attach before bypass so controllers always have req.reservation
    req.reservation = doc;

    if (isAdmin(req.user)) return next();

    if (!isSameUser(doc.user, req.user._id))
      return res.status(403)
        .json({ message: 'Access denied. Not your reservation.' });

    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Merchandise / food order → owner field: order.customerId
const verifyOrderOwner = async (req, res, next) => {
  try {
    const doc = await Order
      .findById(req.params.id).select('customerId');

    if (!doc) return res.status(404)
      .json({ message: 'Order not found.' });

    // Attach before bypass so controllers always have req.order
    req.order = doc;

    if (isAdmin(req.user)) return next();

    if (!isSameUser(doc.customerId, req.user._id))
      return res.status(403)
        .json({ message: 'Access denied. Not your order.' });

    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Promoter withdrawal → owner field: payout.promoterId
const verifyPayoutOwner = async (req, res, next) => {
  try {
    const doc = await Payout
      .findById(req.params.id).select('promoterId');

    if (!doc) return res.status(404)
      .json({ message: 'Payout not found.' });

    // Attach before bypass so controllers always have req.payout
    req.payout = doc;

    if (isAdmin(req.user)) return next();

    if (!isSameUser(doc.promoterId, req.user._id))
      return res.status(403)
        .json({ message: 'Access denied. Not your payout.' });

    next();
  } catch (e) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  verifyReservationOwner,
  verifyOrderOwner,
  verifyPayoutOwner,
};