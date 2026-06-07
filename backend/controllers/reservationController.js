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
            .populate('appliedGift', 'name type value valueType')
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
      .populate({ path: 'appliedGift', select: 'name type value valueType' })  // ← add this
      .sort({ createdAt: -1 })
      .lean();

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
            status: { $nin: ['cancelled', 'rejected', 'refunded'] }
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

const updateReservationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'rejected', 'refunded'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

      const oldStatus = reservation.status;
        reservation.status = status;
        await reservation.save();

        // Restore digital gift if payment/reservation is rejected, refunded, or cancelled
        if (
            ['rejected', 'refunded', 'cancelled'].includes(status) &&
            !['rejected', 'refunded', 'cancelled'].includes(oldStatus) &&
            (reservation.appliedGift || reservation.giftCode)
        ) {
            try {
                const { restoreGiftForUser } = require('./digitalgiftsController');
                const restored = await restoreGiftForUser(
                    reservation.appliedGift?._id || reservation.appliedGift,
                    reservation.user,
                    reservation.giftCode
                );

                if (restored?.wasRestored) {
                    const buyerUser = await User.findById(reservation.user).select('role');
                    const role = buyerUser?.role === 'sponsor' ? 'sponsor' : 'customer';
                    const statusWord = status === 'rejected' ? 'rejected'
                        : status === 'refunded' ? 'refunded'
                        : 'cancelled';
                    const notificationController = require('./notificationController');
                    const { emitUpdate: emitGiftRestore } = require('../socket');

                    const giftNotif = await notificationController.createNotification({
                        title: status === 'rejected' ? 'Payment Rejected — Gift Restored' : 'Gift Restored',
                        content: `Your digital gift "${restored.gift.name}" (${restored.gift.code}) has been returned to your account because your payment was ${statusWord}.`,
                        type: 'payment',
                        path: role === 'sponsor' ? '/sponsor/my-gifts' : '/customer/my-gifts',
                        unread: true,
                        userId: reservation.user,
                        createdBy: req.user._id,
                    });
                    emitGiftRestore('newNotification', giftNotif);
                }
            } catch (giftErr) {
                console.error('Gift restore on reservation status change error:', giftErr);
            }
        }

        // Notify user when payment is confirmed
        if (status === 'confirmed' && oldStatus !== 'confirmed') {
            try {
                const notificationController = require('./notificationController');
                const { emitUpdate: emitNotif } = require('../socket');

                const confirmedEvent = await Event.findById(reservation.event).select('title');
                const reservationInfo = reservation.boothCode
                    ? `booth "${reservation.boothCode}"`
                    : reservation.seatLabels?.length > 0
                        ? `seat(s) "${reservation.seatLabels.join(', ')}"`
                        : 'your reservation';

                // Notify the buyer (sponsor/customer)
                const buyerNotif = await notificationController.createNotification({
                    title: 'Payment Confirmed',
                    content: `Your payment for ${reservationInfo} in "${confirmedEvent?.title || 'the event'}" has been confirmed.`,
                    type: 'payment',
                    path: reservation.type === 'booth' ? '/sponsor/sponsor-my-booths' : '/customer/my-ticketsorder',
                    unread: true,
                    userId: reservation.user,
                    createdBy: req.user._id
                });
                emitNotif('newNotification', buyerNotif);

                // Notify promoters of the event
                const eventForPromoter = await Event.findById(reservation.event)
                    .populate('assignedPromoters', '_id')
                    .populate('createdBy', '_id role');

                if (eventForPromoter) {
                    const buyerUser = await User.findById(reservation.user).select('firstName lastName companyName');
                    const buyerName = buyerUser
                        ? (buyerUser.companyName || `${buyerUser.firstName} ${buyerUser.lastName}`)
                        : 'A user';

                    const promotersToNotify = new Set();
                    if (eventForPromoter.createdBy?.role === 'promoter') {
                        promotersToNotify.add(eventForPromoter.createdBy._id.toString());
                    }
                    if (Array.isArray(eventForPromoter.assignedPromoters)) {
                        eventForPromoter.assignedPromoters.forEach(p => promotersToNotify.add(p._id.toString()));
                    }

                    for (const promoterId of promotersToNotify) {
                        if (promoterId === req.user._id.toString()) continue;
                        const promoterNotif = await notificationController.createNotification({
                            title: 'Payment Confirmed',
                            content: `${buyerName}'s payment for ${reservationInfo} in "${eventForPromoter.title}" has been confirmed.`,
                            type: 'payment',
                            path: '/promoter/promoter-sales',
                            unread: true,
                            userId: promoterId,
                            createdBy: req.user._id
                        });
                        emitNotif('newNotification', promoterNotif);
                    }
                }
            } catch (notifErr) {
                console.error('Confirmed payment notification error:', notifErr);
            }
        }

        // If status changed to rejected, refunded, or cancelled, reset the booth/seat status

        // If status changed to rejected, refunded, or cancelled, reset the booth/seat status in Event layout
        if (['rejected', 'refunded', 'cancelled'].includes(status) && !['rejected', 'refunded', 'cancelled'].includes(oldStatus)) {
            const event = await Event.findById(reservation.event).populate('assignedPromoters', '_id');
            const notificationController = require('./notificationController');
            const { emitUpdate } = require('../socket');

            const reservationInfo = reservation.boothCode
                ? `booth ${reservation.boothCode}`
                : reservation.seatLabels?.length > 0
                    ? `seat(s) ${reservation.seatLabels.join(', ')}`
                    : 'your reservation';

            const statusMessages = {
                refunded: {
                    title: 'Reservation Refunded',
                    content: `Your reservation for ${reservationInfo} has been successfully refunded.`
                },
                cancelled: {
                    title: 'Reservation Cancelled',
                    content: `Your reservation for ${reservationInfo} has been cancelled.`
                },
                rejected: {
                    title: 'Reservation Rejected',
                    content: `Your reservation for ${reservationInfo} has been rejected.`
                }
            };

            const msg = statusMessages[status];
            const notification = await notificationController.createNotification({
                title: msg.title,
                content: msg.content,
                type: 'reservation',
                path: '/sponsor/sponsor-my-booths',
                unread: true,
                userId: reservation.user,   // sends to the sponsor specifically
                createdBy: req.user._id
            });
            emitUpdate('newNotification', notification);
        }

        // If status changed to rejected, refunded, or cancelled, reset the booth/seat status in Event layout
        if (['rejected', 'refunded', 'cancelled'].includes(status) && !['rejected', 'refunded', 'cancelled'].includes(oldStatus)) {
            const event = await Event.findById(reservation.event);
            if (event) {
                let changed = false;

                if (reservation.type === 'booth') {
                    let boothIndex = event.booths.findIndex(b => b._id.toString() === (reservation.boothId || "").toString());
                    if (boothIndex === -1) {
                        boothIndex = event.booths.findIndex(b => b.code === reservation.boothCode || b.label === reservation.boothCode);
                    }

                    if (boothIndex !== -1) {
                        event.booths[boothIndex].status = "available";
                        event.booths[boothIndex].reservedBy = "";
                        event.booths[boothIndex].reservedByEmail = "";
                        event.booths[boothIndex].reservedByPO = "";
                        changed = true;

                        const booth = event.booths[boothIndex];
                        if (booth.priceLevelId && booth.priceLevelId !== "none") {
                            const plIndex = event.priceLevels.findIndex(pl => pl._id.toString() === booth.priceLevelId.toString());
                            if (plIndex !== -1) {
                                event.priceLevels[plIndex].quantitySold = Math.max(0, event.priceLevels[plIndex].quantitySold - 1);
                            }
                        }
                    }

                    // Adjust booth revenue
                    const saleTotal = reservation.amount?.total || 0;
                    if (saleTotal > 0) {
                        event.boothRevenue = Math.max(0, (event.boothRevenue || 0) - saleTotal);
                    }

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
                            event.layoutData.items[layoutItemIndex].reservedByEmail = "";
                            event.layoutData.items[layoutItemIndex].reservedByPO = "";
                            event.markModified('layoutData');
                            changed = true;
                        }
                    }
                } else if (reservation.type === 'seat') {
                    const seatIds = reservation.seatIds || [];
                    const seatLabels = reservation.seatLabels || [];

                    // Adjust seat revenue
                    const saleTotal = reservation.amount?.total || 0;
                    if (saleTotal > 0) {
                        event.seatRevenue = Math.max(0, (event.seatRevenue || 0) - saleTotal);
                    }

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
                                    event.layoutData.items[index].ticketId = "";

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
                    event.markModified('booths');
                    event.markModified('priceLevels');
                    await event.save();
                }
            }
        }

        // Notify promoters when a reservation on their event is refunded/cancelled/rejected
        if (['rejected', 'refunded', 'cancelled'].includes(status) && !['rejected', 'refunded', 'cancelled'].includes(oldStatus)) {
            try {
                const notificationController = require('./notificationController');
                const { emitUpdate: emit } = require('../socket');

                const eventForNotif = await Event.findById(reservation.event)
                    .populate('assignedPromoters', '_id')
                    .populate('createdBy', '_id role');

                if (eventForNotif) {
                    // Get the buyer's name from the reservation
                    const buyerUser = await User.findById(reservation.user).select('firstName lastName companyName');
                    const buyerName = buyerUser
                        ? (buyerUser.companyName || `${buyerUser.firstName} ${buyerUser.lastName}`)
                        : 'A user';

                    const reservationInfo = reservation.boothCode
                        ? `booth "${reservation.boothCode}"`
                        : reservation.seatLabels?.length > 0
                            ? `seat(s) "${reservation.seatLabels.join(', ')}"`
                            : 'a reservation';

                    const statusWord = status === 'refunded' ? 'refunded'
                        : status === 'rejected' ? 'rejected'
                        : 'cancelled';

                    const notifTitle = `Reservation ${statusWord.charAt(0).toUpperCase() + statusWord.slice(1)}`;
                    const notifContent = `${buyerName}'s reservation for ${reservationInfo} in "${eventForNotif.title}" has been ${statusWord}.`;

                    // Collect promoters to notify: creator + assigned promoters
                    const promotersToNotify = new Set();
                    if (eventForNotif.createdBy && eventForNotif.createdBy.role === 'promoter') {
                        promotersToNotify.add(eventForNotif.createdBy._id.toString());
                    }
                    if (Array.isArray(eventForNotif.assignedPromoters)) {
                        eventForNotif.assignedPromoters.forEach(p => promotersToNotify.add(p._id.toString()));
                    }

                    for (const promoterId of promotersToNotify) {
                        // Don't notify if the promoter is the one making the status change
                        if (promoterId === req.user._id.toString()) continue;

                        const notif = await notificationController.createNotification({
                            title: notifTitle,
                            content: notifContent,
                            type: 'reservation',
                            path: '/promoter/promoter-sales',
                            unread: true,
                            userId: promoterId,
                            createdBy: req.user._id
                        });
                        emit('newNotification', notif);
                    }
                }
            } catch (notifErr) {
                console.error('Promoter notification error:', notifErr);
                // Don't crash the main response
            }
        }

        const { emitUpdate } = require("../socket");
        emitUpdate('dashboardUpdate');

        res.status(200).json(reservation);
    } catch (error) {
        console.error("Update Reservation Status Error:", error);
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
    getEventSalesForPromoter,
    checkInReservation,
    updateStoreSettings,
    updateReservationStatus
};

