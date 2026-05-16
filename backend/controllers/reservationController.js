const Reservation = require('../models/reservationModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');
const mongoose = require('mongoose');
const path = require('path');
const { optimizeImage } = require("../utils/imageOptimizer");

// Fetch personal reservations for the sponsor
const getMyReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find({
            $or: [{ user: req.user._id }, { exhibitors: req.user._id }]
        })
            .populate('user', 'firstName lastName email companyName phone avatar industry description')
            .populate('event', 'title startDate endDate startTime endTime image venue')
            .populate('exhibitors', 'firstName lastName email avatar')
            .sort({ createdAt: -1 });

        // Filter out reservations where the event was deleted (orphaned reservations)
        const validReservations = reservations.filter(r => r.event !== null);

        res.status(200).json(validReservations);
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

        // Filter out reservations where the event was deleted
        const validReservations = reservations.filter(r => r.event !== null);

        console.log(`Admin Reservations: Successfully fetched ${validReservations.length} records.`);
        res.status(200).json(validReservations);
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

        // 1. Find the Event and reset statuses
        const event = await Event.findById(reservation.event);

        if (event) {
            let changed = false;

            if (reservation.type === 'booth') {
                // Re-use logic to find booth by id or code
                let boothIndex = event.booths.findIndex(b => b._id.toString() === (reservation.boothId || "").toString());
                if (boothIndex === -1) {
                    boothIndex = event.booths.findIndex(b => b.code === reservation.boothCode || b.label === reservation.boothCode);
                }

                if (boothIndex !== -1) {
                    // Reset booth status
                    event.booths[boothIndex].status = "available";
                    event.booths[boothIndex].reservedBy = "";
                    changed = true;

                    // Adjust Price Level quantitySold for booth
                    const booth = event.booths[boothIndex];
                    if (booth.priceLevelId && booth.priceLevelId !== "none") {
                        const plIndex = event.priceLevels.findIndex(pl => pl._id.toString() === booth.priceLevelId.toString());
                        if (plIndex !== -1) {
                            event.priceLevels[plIndex].quantitySold = Math.max(0, event.priceLevels[plIndex].quantitySold - 1);
                        }
                    }
                }

                // Fix layoutData if exists
                if (event.layoutData && event.layoutData.items) {
                    const identifier = (reservation.boothId || "").toString();
                    const layoutItemIndex = event.layoutData.items.findIndex(item =>
                        (item._id?.toString() === identifier ||
                            item.id?.toString() === identifier ||
                            item.code === reservation.boothCode ||
                            item.label === reservation.boothCode) &&
                        (item.type || "").toLowerCase() === 'booth'
                    );
                    if (layoutItemIndex !== -1) {
                        event.layoutData.items[layoutItemIndex].status = "available";
                        event.layoutData.items[layoutItemIndex].reservedBy = "";
                        event.markModified('layoutData');
                        changed = true;
                    }
                }
            } else if (reservation.type === 'seat') {
                const seatIds = reservation.seatIds || [];
                const seatLabels = reservation.seatLabels || [];

                // Reset statuses in layoutData
                if (event.layoutData && event.layoutData.items) {
                    event.layoutData.items.forEach((item, index) => {
                        const type = (item.type || "").toLowerCase();
                        const idStr = (item._id || item.id || "").toString();

                        if (type === "seat") {
                            const isThisSeat = seatIds.includes(idStr) || seatLabels.includes(item.label) || seatLabels.includes(item.code);

                            if (isThisSeat) {
                                event.layoutData.items[index].status = "available";
                                event.layoutData.items[index].reservedBy = "";
                                event.layoutData.items[index].reservedByEmail = "";
                                event.layoutData.items[index].reservedByPO = "";

                                // Adjust Price Level quantitySold for seat
                                const priceLevelId = item.categoryId || item.priceLevelId;
                                if (priceLevelId && priceLevelId !== "none") {
                                    const plIndex = event.priceLevels.findIndex(pl => pl._id.toString() === priceLevelId.toString());
                                    if (plIndex !== -1) {
                                        event.priceLevels[plIndex].quantitySold = Math.max(0, event.priceLevels[plIndex].quantitySold - 1);
                                    }
                                }
                                changed = true;
                            }
                        }
                    });
                    if (changed) event.markModified('layoutData');
                }
            }

            if (changed) {
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
            .populate('user', 'firstName lastName email companyName phone avatar industry description')
            .populate('exhibitors', 'firstName lastName email avatar');

        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        // Security check: ensure the reservation belongs to the user (unless admin)
        const isOwner = reservation.user._id.toString() === req.user._id.toString();
        const isExhibitor = reservation.exhibitors.some(e => e._id.toString() === req.user._id.toString());
        if (req.user.role !== 'admin' && !isOwner && !isExhibitor) {
            return res.status(403).json({ error: "You are not authorized to view this reservation" });
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error("GET RESERVATION BY ID ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

const addExhibitors = async (req, res) => {
    const { id } = req.params;
    const { userIds } = req.body;

    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only the reservation owner can add exhibitors" });
        }

        // Add userIds to exhibitors array if not already present
        const newExhibitors = userIds.filter(userId => !reservation.exhibitors.includes(userId));
        reservation.exhibitors.push(...newExhibitors);

        await reservation.save();

        // Notify new exhibitors
        const notificationController = require('./notificationController');
        const { emitUpdate } = require('../socket');
        const sponsorName = req.user.companyName || `${req.user.firstName} ${req.user.lastName}`;

        for (const userId of newExhibitors) {
            const notification = await notificationController.createNotification({
                title: `Added as Exhibitor`,
                content: `${sponsorName} added you as an exhibitor for booth ${reservation.boothCode}`,
                type: 'reservation',
                path: '/sponsor/sponsor-my-booths',
                unread: true,
                userId: userId,
                createdBy: req.user._id
            });
            emitUpdate('newNotification', notification);
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error("Add Exhibitors Error:", error);
        res.status(500).json({ error: error.message });
    }
};

const removeExhibitor = async (req, res) => {
    const { id, userId } = req.params;

    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only the reservation owner can remove exhibitors" });
        }

        reservation.exhibitors = reservation.exhibitors.filter(e => e.toString() !== userId);

        await reservation.save();
        res.status(200).json(reservation);
    } catch (error) {
        console.error("Remove Exhibitor Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Fetch all booth reservations for a specific event (used by Customers to see "Stores")
const getEventBoothReservations = async (req, res) => {
    const { eventId } = req.params;

    try {
        const reservations = await Reservation.find({
            event: eventId,
            type: 'booth',
            status: 'confirmed'
        })
            .populate('user', 'firstName lastName email companyName phone avatar industry description logo')
            .sort({ createdAt: -1 });

        res.status(200).json(reservations);
    } catch (error) {
        console.error("GET EVENT BOOTH RESERVATIONS ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

const updateStoreSettings = async (req, res) => {
    const { id } = req.params;
    const { companyName, industry, description } = req.body;

    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        // Security check: only allow owner or admin to update store settings
        const isOwner = reservation.user.toString() === req.user._id.toString();

        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({ error: "Only the booth owner can update store settings" });
        }

        if (!reservation.storeSettings) {
            reservation.storeSettings = {};
        }

        if (companyName !== undefined) reservation.storeSettings.companyName = companyName;
        if (industry !== undefined) reservation.storeSettings.industry = industry;
        if (description !== undefined) reservation.storeSettings.description = description;

        if (req.file) {
            const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
            await optimizeImage(filePath, 70, 400);
            reservation.storeSettings.logo = `/uploads/${req.file.filename}`;
        }

        // Mark modified since it's a nested object
        reservation.markModified('storeSettings');
        await reservation.save();

        res.status(200).json(reservation);
    } catch (error) {
        console.error("UPDATE STORE SETTINGS ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

// Fetch all reservations (tickets + booths) for an event â promoter must be assigned
const getEventSalesForPromoter = async (req, res) => {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ error: 'Invalid event ID' });
    }

    try {
        const event = await Event.findById(eventId).select('createdBy assignedPromoters title venue startDate endDate priceLevels');
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Authorization: creator OR assigned promoter OR admin/superadmin
        const userId = req.user._id.toString();
        const hasHighLevelAccess = ['admin', 'superadmin'].includes(req.user.role);
        const isCreator = event.createdBy?.toString() === userId;
        const isAssigned = (event.assignedPromoters || []).some(id => id.toString() === userId);

        if (!hasHighLevelAccess && !isCreator && !isAssigned) {
            return res.status(403).json({ error: 'You are not assigned to this event.' });
        }

        const reservations = await Reservation.find({
            event: eventId,
            status: { $ne: 'cancelled' }
        })
            .populate('user', 'firstName lastName email companyName avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({ event, reservations });
    } catch (error) {
        console.error('GET EVENT SALES FOR PROMOTER ERROR:', error);
        res.status(500).json({ error: error.message });
    }
};

// Scan a QR code / manual button  cycles through 6 states:
//   Scan 1 (idx 0) ? Check In 1   (type: 'checkin')
//   Scan 2 (idx 1) ? Exit 1        (type: 'exit')
//   Scan 3 (idx 2) ? Check In 2   (type: 'checkin')
//   Scan 4 (idx 3) ? Exit 2        (type: 'exit')
//   Scan 5 (idx 4) ? Check In 3   (type: 'checkin')
//   Scan 6 (idx 5) ? Exit 3        (type: 'exit')
//   7th+ action ? blocked (max 6 events reached)
const checkInReservation = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid reservation ID' });
    }

    try {
        const reservation = await Reservation.findById(id)
            .populate('user', 'firstName lastName email companyName avatar')
            .populate('event', 'createdBy assignedPromoters title');

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        if (!reservation.event) {
            return res.status(404).json({ error: 'Associated event not found' });
        }

        // Authorization: only assigned promoters or admin/superadmin
        const userId = req.user._id.toString();
        const hasHighLevelAccess = ['admin', 'superadmin'].includes(req.user.role);
        const isCreator = reservation.event.createdBy?.toString() === userId;
        const isAssigned = (reservation.event.assignedPromoters || []).some(
            pid => pid.toString() === userId
        );

        if (!hasHighLevelAccess && !isCreator && !isAssigned) {
            return res.status(403).json({ error: 'You are not assigned to this event.' });
        }

        // Initialise checkIns array if missing (legacy records)
        if (!reservation.checkIns) {
            reservation.checkIns = [];
        }

        const scanCount = reservation.checkIns.length;

        // Maximum 6 scan events allowed (3 check-ins + 3 exits)
        if (scanCount >= 6) {
            return res.status(200).json({
                message: 'Maximum check-in limit reached',
                maxReached: true,
                reservation
            });
        }

        // Even index (0,2,4) ? checkin; Odd index (1,3,5) ? exit
        const nextType = scanCount % 2 === 0 ? 'checkin' : 'exit';

        reservation.checkIns.push({ time: new Date(), type: nextType });
        reservation.markModified('checkIns');

        // Keep legacy fields in sync: checkedIn = true when currently inside (checkin)
        reservation.checkedIn = nextType === 'checkin';
        if (scanCount === 0) {
            // First check-in  set checkedInAt for backward compatibility
            reservation.checkedInAt = reservation.checkIns[0].time;
        }

        await reservation.save();

        const labels = { checkin: 'Check-in', exit: 'Exit' };
        const scanNumber = scanCount + 1;
        return res.status(200).json({
            message: `${labels[nextType]} recorded (scan ${scanNumber} of 6)`,
            alreadyCheckedIn: false,
            maxReached: false,
            scanNumber,
            actionType: nextType,
            reservation
        });
    } catch (error) {
        console.error('CHECK-IN RESERVATION ERROR:', error);
        return res.status(500).json({ error: error.message });
    }
};
module.exports = {
    getMyReservations,
    getAllReservations,
    deleteReservation,
    getReservationById,
    addExhibitors,
    removeExhibitor,
    getEventBoothReservations,
    getEventSalesForPromoter,
    checkInReservation,
    updateStoreSettings
};

