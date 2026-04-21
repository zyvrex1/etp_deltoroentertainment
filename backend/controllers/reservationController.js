const Reservation = require('../models/reservationModel');

// Fetch personal reservations for the sponsor
const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id })
            .populate('event', 'title startDate endDate image venue')
            .sort({ createdAt: -1 });

        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch all reservations for admin view
const getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({})
            .populate('user', 'firstName lastName email companyName')
            .populate('event', 'title startDate')
            .sort({ createdAt: -1 });

        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMyReservations,
    getAllReservations
};
