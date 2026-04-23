const Reservation = require('../models/reservationModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');

// Fetch personal reservations for the sponsor
const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({ user: req.user._id })
            .populate('event', 'title startDate endDate image venue')
            .sort({ createdAt: -1 });

        res.status(200).json(reservations);
    } catch (error) {
        console.error("GET MY RESERVATIONS ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

// Fetch all reservations for admin view
const getAllReservations = async (req, res) => {
    try {
        console.log("Admin Reservations: Fetching...");
        
        const reservations = await Reservation.find({})
            .populate({ path: 'user', select: 'firstName lastName email companyName' })
            .populate({ path: 'event', select: 'title startDate' })
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for faster, read-only results

        console.log(`Admin Reservations: Successfully fetched ${reservations.length} records.`);
        res.status(200).json(reservations);
    } catch (error) {
        console.error("CRITICAL ADMIN RESERVATIONS ERROR:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

const deleteReservation = async (req, res) => {
    const { id } = req.params;

    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        // 1. Find the Event and the Booth
        const event = await Event.findById(reservation.event);

        if (event) {
            // Re-use logic to find booth by id or code
            let boothIndex = event.booths.findIndex(b => b._id.toString() === reservation.boothId.toString());
            if (boothIndex === -1) {
                boothIndex = event.booths.findIndex(b => b.code === reservation.boothCode || b.label === reservation.boothCode);
            }

            if (boothIndex !== -1) {
                // Reset booth status
                event.booths[boothIndex].status = "available";
                event.booths[boothIndex].reservedBy = "";

                // Fix layoutData if exists
                if (event.layoutData && event.layoutData.items) {
                    const identifier = reservation.boothId.toString();
                    const layoutItemIndex = event.layoutData.items.findIndex(item =>
                        item._id?.toString() === identifier ||
                        item.id?.toString() === identifier ||
                        item.code === reservation.boothCode ||
                        item.label === reservation.boothCode
                    );
                    if (layoutItemIndex !== -1) {
                        event.layoutData.items[layoutItemIndex].status = "available";
                        event.layoutData.items[layoutItemIndex].reservedBy = "";
                        event.markModified('layoutData');
                    }
                }

                // Adjust Price Level quantitySold
                const booth = event.booths[boothIndex];
                if (booth.priceLevelId && booth.priceLevelId !== "none") {
                    const plIndex = event.priceLevels.findIndex(pl => pl._id.toString() === booth.priceLevelId.toString());
                    if (plIndex !== -1) {
                        event.priceLevels[plIndex].quantitySold = Math.max(0, event.priceLevels[plIndex].quantitySold - 1);
                    }
                }

                await event.save();
            }
        }

        // 2. Delete the reservation
        await Reservation.findByIdAndDelete(id);

        const { emitUpdate } = require("../socket");
        emitUpdate('dashboardUpdate');

        // Create Notification for Admins
        const notificationController = require('./notificationController');
        const adminName = `${req.user.firstName} ${req.user.lastName}`;
        const reservationInfo = reservation.boothCode ? `booth ${reservation.boothCode}` : `a booth`;
        
        const notification = await notificationController.createNotification({
            title: `Reservation Cancelled`,
            content: `${adminName} cancelled reservation for ${reservationInfo} in event "${event?.title || 'Unknown Event'}"`,
            type: 'reservation',
            path: '/admin/payments',
            unread: true,
            createdBy: req.user._id,
            targetRole: 'admin'
        });
        emitUpdate('newNotification', notification);

        res.status(200).json({ message: "Reservation deleted and booth status reset" });
    } catch (error) {
        console.error("Delete Reservation Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Fetch a single reservation by ID
const getReservationById = async (req, res) => {
    const { id } = req.params;

    try {
        const reservation = await Reservation.findById(id)
            .populate('event', 'title startDate endDate image venue booths priceLevels layoutData hasBooths description')
            .populate('user', 'firstName lastName email companyName');

        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        // Security check: ensure the reservation belongs to the user (unless admin)
        if (req.user.role !== 'admin' && reservation.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: "You are not authorized to view this reservation" });
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error("GET RESERVATION BY ID ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMyReservations,
    getAllReservations,
    deleteReservation,
    getReservationById
};
