const Reservation = require('../models/reservationModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');
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

        // Security check: allow owner or exhibitors
        const isOwner = reservation.user.toString() === req.user._id.toString();
        const isExhibitor = reservation.exhibitors && reservation.exhibitors.some(e => e.toString() === req.user._id.toString());
        
        if (req.user.role !== 'admin' && !isOwner && !isExhibitor) {
            return res.status(403).json({ error: "Unauthorized" });
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

module.exports = {
    getMyReservations,
    getAllReservations,
    deleteReservation,
    getReservationById,
    addExhibitors,
    removeExhibitor,
    getEventBoothReservations,
    updateStoreSettings
};
