const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Event = require("../models/eventModel");
const Reservation = require("../models/reservationModel");
const Merchandise = require("../models/merchandiseModel");
const { toObjectId } = require("../utils/helpers");

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { emitUpdate } = require("../socket");
const { optimizeImage } = require("../utils/imageOptimizer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const cleanName = originalName.replace(/\s+/g, "-").toLowerCase();

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    const timestamp = `${mm}${dd}${yy}${hh}${min}`;

    cb(null, `${cleanName}-${timestamp}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPG, PNG, WEBP)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
});

const autoHealEvents = async (eventsArr) => {
  if (!eventsArr || eventsArr.length === 0) return eventsArr;

  const isArray = Array.isArray(eventsArr);
  const events = isArray ? eventsArr : [eventsArr];
  const eventIds = events.map((e) => e._id);

  try {
    // 1. Fetch all ACTIVE reservations for these events (not cancelled)
    const reservations = await Reservation.find({ 
      event: { $in: eventIds },
      status: { $ne: 'cancelled' }
    });

    for (let event of events) {
      let changed = false;
      const eventReservations = reservations.filter(
        (r) => r.event.toString() === event._id.toString(),
      );

      // Booth data
      const reservedBoothIds = eventReservations
        .filter((r) => r.type === "booth" && r.boothId)
        .map((r) => r.boothId.toString());
      const reservedBoothCodes = eventReservations
        .filter((r) => r.type === "booth" && r.boothCode)
        .map((r) => r.boothCode);

      // Seat data
      const reservedSeatIds = eventReservations
        .filter((r) => r.type === "seat" && r.seatIds)
        .flatMap((r) => r.seatIds.map(id => id.toString()));
      const reservedSeatLabels = eventReservations
        .filter((r) => r.type === "seat" && r.seatLabels)
        .flatMap((r) => r.seatLabels);

      // 2. Cross-reference booths array
      if (event.booths && event.booths.length > 0) {
        event.booths.forEach((booth, index) => {
          const idStr = (booth._id || "").toString();
          const isReserved =
            reservedBoothIds.includes(idStr) ||
            reservedBoothCodes.includes(booth.code) ||
            reservedBoothCodes.includes(booth.label);

          if (booth.status === "sold" && !isReserved) {
            event.booths[index].status = "available";
            event.booths[index].reservedBy = "";
            changed = true;
          } else if (booth.status === "available" && isReserved) {
            event.booths[index].status = "sold";
            changed = true;
          }
        });
      }

      // 3. Cross-reference layoutData items
      if (event.layoutData && event.layoutData.items) {
        event.layoutData.items.forEach((item, index) => {
          const type = (item.type || "").toLowerCase();
          const idStr = (item._id || item.id || "").toString();

          if (type === "booth") {
            const isReserved =
              reservedBoothIds.includes(idStr) ||
              reservedBoothCodes.includes(item.code) ||
              reservedBoothCodes.includes(item.label);

            if (item.status === "sold" && !isReserved) {
              event.layoutData.items[index].status = "available";
              event.layoutData.items[index].reservedBy = "";
              changed = true;
            } else if (
              (item.status === "available" || !item.status) &&
              isReserved
            ) {
              event.layoutData.items[index].status = "sold";
              changed = true;
            }
          } else if (type === "seat") {
            const isReserved = 
              reservedSeatIds.includes(idStr) ||
              reservedSeatLabels.includes(item.label) ||
              reservedSeatLabels.includes(item.code);

            if (item.status === "sold" && !isReserved) {
              // Only reset if it's not actually reserved anymore
              event.layoutData.items[index].status = "available";
              event.layoutData.items[index].reservedBy = "";
              event.layoutData.items[index].reservedByEmail = "";
              event.layoutData.items[index].reservedByPO = "";
              changed = true;
            } else if (
              (item.status === "available" || !item.status) &&
              isReserved
            ) {
              event.layoutData.items[index].status = "sold";
              changed = true;
            }
          }
        });
      }

      // 4. Persist corrections using findByIdAndUpdate
      if (changed) {
        const updatePayload = {};
        if (event.booths) updatePayload.booths = event.booths;
        if (event.layoutData) updatePayload.layoutData = event.layoutData;

        await Event.findByIdAndUpdate(
          event._id,
          { $set: updatePayload },
          { new: true }
        ).catch((err) => console.error("Auto-heal update failed:", err.message));
      }
    }
  } catch (error) {
    console.error("Auto-heal error:", error);
  }

  return isArray ? events : events[0];
};


const getEvents = async (req, res) => {
  try {
    const user = req.user;
    let eventsQuery;

    if (user) {
      const role = user.role?.toLowerCase();
      console.log("Decoded user role:", role);

      if (role === "superadmin" || role === "admin") {
        const { status } = req.query;
        const filter = status ? { status } : {};
        eventsQuery = Event.find(filter).sort({ createdAt: -1 });
      } else if (role === "promoter") {
        eventsQuery = Event.find({
          $or: [
            { createdBy: user._id },
            { assignedPromoters: user._id, status: "approved" },
          ],
        }).sort({
          createdAt: -1,
        });
      } else if (role === "customer" || role === "sponsor") {
        eventsQuery = Event.find({ status: "approved" }).sort({
          createdAt: -1,
        });
      } else {
        return res.status(403).json({ error: "Unauthorized role" });
      }
    } else {
      // Public access: Allow both approved (live) and completed (past) events
      const { status } = req.query;
      const allowedPublicStatus = ["approved", "completed"];

      if (status && allowedPublicStatus.includes(status)) {
        eventsQuery = Event.find({ status }).sort({ createdAt: -1 });
      } else {
        eventsQuery = Event.find({ status: { $in: allowedPublicStatus } }).sort(
          { createdAt: -1 },
        );
      }
    }

    // Mark past due approved events as completed
    const now = new Date();

    // Fetch all approved events and check their times in memory
    const approvedEvents = await Event.find({ status: "approved" });

    const completedIds = [];
    for (const event of approvedEvents) {
      if (event.endDate && event.endTime) {
        const [hours, minutes] = event.endTime.split(":").map(Number);
        const endDateTime = new Date(event.endDate);
        endDateTime.setHours(hours, minutes, 0, 0);

        if (endDateTime < now) {
          completedIds.push(event._id);
        }
      } else if (event.endDate && event.endDate < now) {
        // Fallback for events without specific times
        completedIds.push(event._id);
      }
    }

    if (completedIds.length > 0) {
      await Event.updateMany(
        { _id: { $in: completedIds } },
        { status: "completed" },
      );
    }

    // Re-run the filter if it was a public/approved query to ensure completed items don't show up
    // Or just re-fetch the query to be safe
    let events = await eventsQuery.populate([
      {
        path: "createdBy",
        select: "firstName lastName role email avatar companyName lastActive",
      },
      {
        path: "assignedPromoters",
        select: "firstName lastName email avatar lastActive",
      },
    ]);

    events = await autoHealEvents(events);

    return res.status(200).json(events);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  try {
    const user = req.user;
    const role = user?.role?.toLowerCase() || "guest";

    let eventQuery;

    if (role === "superadmin" || role === "admin") {
      eventQuery = Event.findById(id);
    } else if (role === "promoter") {
      // Promoter owns it or it's approved/completed
      eventQuery = Event.findOne({
        _id: id,
        $or: [
          { createdBy: user._id },
          { status: { $in: ["approved", "completed"] } },
        ],
      });
    } else {
      // Guest, Customer, or Sponsor can see approved/completed events
      eventQuery = Event.findOne({
        _id: id,
        status: { $in: ["approved", "completed"] },
      });
    }

    const event = await eventQuery.populate([
      {
        path: "createdBy",
        select: "firstName lastName role email avatar",
      },
      {
        path: "assignedPromoters",
        select: "firstName lastName email avatar",
      },
    ]);

    if (!event) {
      return res.status(404).json({ error: "No such event" });
    }

    // 🔥 Resilient auto-status-update
    try {
      const now = new Date();
      let shouldUpdate = false;

      if (event.status === "approved") {
        if (event.endDate && event.endTime) {
          const [hours, minutes] = event.endTime.split(":").map(Number);
          const endDateTime = new Date(event.endDate);
          endDateTime.setHours(hours, minutes, 0, 0);

          if (endDateTime < now) {
            event.status = "completed";
            shouldUpdate = true;
          }
        } else if (event.endDate && new Date(event.endDate) < now) {
          event.status = "completed";
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          await event.save();
        }
      }
    } catch (saveError) {
      console.error(
        "Warning: Failed to auto-update event status:",
        saveError.message,
      );
      // We don't crash the request because the event still exists and is fetched.
    }

    // Auto-heal on the fly
    const healedEvent = await autoHealEvents(event);

    return res.status(200).json(healedEvent);
  } catch (error) {
    console.error("Error fetching event details:", error);
    return res.status(400).json({ error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    let {
      title,

      description,

      category,

      venue,

      startDate,

      endDate,

      startTime,

      endTime,

      priceLevels = [],

      seatMap = null,

      booths = [],

      isFeatured = false,
      eventType,
    } = req.body;

    if (typeof venue === "string") venue = JSON.parse(venue);

    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);

    if (typeof booths === "string") booths = JSON.parse(booths);

    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

    const image = req.file ? req.file.filename : null;

    // Optimize image if uploaded

    if (req.file) {
      const filePath = path.join(__dirname, "..", "uploads", req.file.filename);

      await optimizeImage(filePath);
    }

    const requiredFields = [
      "title",

      "description",

      "category",

      "startDate",

      "endDate",

      "startTime",

      "endTime",
    ];

    let errors = [];

    requiredFields.forEach((field) => {
      if (!req.body[field] || String(req.body[field]).trim() === "") {
        errors.push(field);
      }
    });

    const venueFields = ["name", "address", "city", "zipCode"];

    if (!venue || typeof venue !== "object") {
      venueFields.forEach((f) => errors.push(`venue.${f}`));
    } else {
      venueFields.forEach((f) => {
        if (!venue[f]) errors.push(`venue.${f}`);
      });
    }



    if (priceLevels && priceLevels.length > 0) {
      priceLevels = priceLevels.map((p) => {
        // Ensure we create a fresh ObjectId if one is provided,

        // or let Mongoose generate one if not.

        const newId = p._id ? toObjectId(p._id) : new mongoose.Types.ObjectId();

        return {
          ...p,

          _id: newId,

          facePrice: Number(p.facePrice || 0),

          serviceCharge: Number(p.serviceCharge || 0),

          quantityAvailable: Number(p.quantityAvailable || 0),

          quantitySold: Number(p.quantitySold || 0),

          isActive: p.isActive !== false,
        };
      });
    }

    // 1. Safely generate string IDs for comparison

    const priceLevelIdStrings = (priceLevels || [])
      .map((p) => p._id?.toString())
      .filter(Boolean);

    // 2. Seating Arrangement Logic

    if (eventType === "Seating Arrangement" && seatMap) {
      seatMap.sections?.forEach((section, sIndex) => {
        section.seats?.forEach((seat, i) => {
          const seatPillarId = seat.priceLevelId?.toString();

          if (seatPillarId) {
            // If it's not "none", validate it against your actual price levels

            if (
              seatPillarId !== "none" &&
              priceLevelIdStrings.length > 0 &&
              !priceLevelIdStrings.includes(seatPillarId)
            ) {
              errors.push(
                `seatMap.sections[${sIndex}].seats[${i}].invalidPriceLevelId`,
              );
            }

            // THE FIX: If it's "none", keep it as "none". Otherwise, convert to ObjectId.

            seat.priceLevelId =
              seat.priceLevelId === "none"
                ? "none"
                : toObjectId(seat.priceLevelId);
          } else {
            // If it's completely missing, we can default it to "none" here too

            seat.priceLevelId = "none";
          }
        });
      });
    }

    // 3. Booths Logic (Fixed the variable name from priceLevelIds to priceLevelIdStrings)

    const hasBooths = Array.isArray(booths) && booths.length > 0;

    if (hasBooths) {
      booths.forEach((b, i) => {
        const boothPidString = b.priceLevelId?.toString();

        if (boothPidString) {
          if (
            boothPidString !== "none" &&
            priceLevelIdStrings.length > 0 &&
            !priceLevelIdStrings.includes(boothPidString)
          ) {
            errors.push(`booths[${i}].invalidPriceLevelId`);
          }

          // THE FIX: Apply the same logic for booths

          b.priceLevelId =
            b.priceLevelId === "none" ? "none" : toObjectId(b.priceLevelId);
        } else {
          // Defaulting to "none" instead of the first price level

          // is safer if you want to allow unassigned booths.

          b.priceLevelId = "none";
        }
      });
    }

    if (errors.length) {
      return res

        .status(400)

        .json({ error: "Validation failed", fields: errors });
    }

    /* =========================

       USER INFO

    ========================= */

    const userId = req.user._id;

    const roleLower = (req.user.role || "").toLowerCase();

    const status =
      roleLower === "admin" || roleLower === "superadmin"
        ? "approved"
        : "pending";

    const newEvent = await Event.create({
      title,

      description,

      category,

      venue,

      startDate,

      endDate,

      startTime,

      endTime,

      eventType,

      image,

      priceLevels,

      seatMap: eventType === "General Admission" ? null : seatMap,

      booths: Array.isArray(booths) ? booths : [],

      hasBooths: Array.isArray(booths) && booths.length > 0,

      isFeatured: Boolean(isFeatured),

      createdBy: userId,

      status,
    });

    const populatedEvent = await newEvent.populate(
      "createdBy",

      "firstName lastName role email avatar",
    );

    // Create Notification for admin if event is pending

    if (status === "pending") {
      const notificationController = require("./notificationController");

      const creatorName = populatedEvent.createdBy
        ? `${populatedEvent.createdBy.firstName} ${populatedEvent.createdBy.lastName}`
        : "A promoter";

      const notification = await notificationController.createNotification({
        title: `New event "${title}" pending approval`,

        content: `submitted by ${creatorName}`,

        type: "event",

        path: "/admin/events",

        unread: true,

        createdBy: populatedEvent.createdBy
          ? populatedEvent.createdBy._id
          : null,

        targetRole: "admin",
      });

      emitUpdate("newNotification", notification);
    } else if (status === "approved") {
      // Notify sponsors of a new approved (live) event
      const notificationController = require("./notificationController");
      const notification = await notificationController.createNotification({
        title: `New Event: ${title}`,
        content: `A new event has been posted. Check it out!`,
        type: "event",
        path: "/sponsor/sponsor-events",
        unread: true,
        createdBy: userId,
        targetRole: "sponsor",
      });
      emitUpdate("newNotification", notification);
    }

    emitUpdate("dashboardUpdate");

    return res.status(201).json({ event: populatedEvent });
  } catch (error) {
    console.error("Create Event Error:", error);

    return res.status(500).json({
      error: "Server error while creating event",

      message: error.message,
    });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  const event = await Event.findOneAndDelete({ _id: id });

  if (!event) {
    return res.status(404).json({ error: "No such event" });
  }

  // Create Notification and Emit
  const notificationController = require("./notificationController");
  const creatorName = `${req.user.firstName} ${req.user.lastName}`;

  // 1. System notification for admins
  const adminNotification = await notificationController.createNotification({
    title: `${creatorName} deleted event: ${event.title}`,
    content: `The event has been permanently removed.`,
    type: "event",
    path: "/admin/events",
    unread: true,
    createdBy: req.user._id,
    targetRole: "admin",
  });
  emitUpdate("newNotification", adminNotification);

  // 2. Notifications for assigned promoters
  if (event.assignedPromoters && event.assignedPromoters.length > 0) {
    for (const promoterId of event.assignedPromoters) {
      const promoterNotification =
        await notificationController.createNotification({
          title: `Event Deleted: ${event.title}`,
          content: `An event you were assigned to has been deleted by ${creatorName}.`,
          type: "event",
          path: "/promoter/promoter-eventmanagement",
          unread: true,
          userId: promoterId,
          createdBy: req.user._id,
        });
      emitUpdate("newNotification", promoterNotification);
    }
  }

  // 3. Cascade delete associated records
  try {
    // Delete all reservations for this event
    await Reservation.deleteMany({ event: id });
    
    // Delete all merchandise/products for this event
    // Note: Merchandise eventId is a string in the model
    await Merchandise.deleteMany({ eventId: id.toString() });
    
    console.log(`Cascade delete completed for event: ${id}`);
  } catch (cascadeError) {
    console.error("Error during cascade delete:", cascadeError);
    // We don't return an error response here because the main event is already deleted
  }

  emitUpdate("dashboardUpdate");
  res.status(200).json(event);
};

const updateEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  try {
    const existingEvent = await Event.findById(id);
    if (!existingEvent) return res.status(404).json({ error: "No such event" });

    let {
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      startTime,
      endTime,
      eventType,
      priceLevels,
      seatMap,
      booths,
      isFeatured,
      image,
      assignedPromoters,
      ticketCategories,
      layoutData,
      status,
      rejectionReason,
    } = req.body;

    const roleLower = (req.user.role || "").toLowerCase();
    const isOwner = String(existingEvent.createdBy) === String(req.user._id);
    const isAdmin = roleLower === "admin" || roleLower === "superadmin";

    // 🛑 Restriction: Only owner or admin can manage the promoter team
    if (assignedPromoters !== undefined && !isOwner && !isAdmin) {
      return res
        .status(403)
        .json({
          error:
            "Permission denied. Only the event creator can manage the promoter team.",
        });
    }

    // Parse JSON strings from FormData
    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);
    if (typeof ticketCategories === "string")
      ticketCategories = JSON.parse(ticketCategories);
    if (typeof layoutData === "string") layoutData = JSON.parse(layoutData);

    const errors = [];
    const finalEventType = eventType || existingEvent.eventType;

    /* =========================
        VALIDATION
    ========================= */
    const fieldsToCheck = ["title", "description", "category"];
    fieldsToCheck.forEach((field) => {
      if (
        req.body[field] !== undefined &&
        String(req.body[field]).trim() === ""
      ) {
        errors.push(`${field} cannot be empty`);
      }
    });

    const validEventTypes = [
      "General Admission",
      "Seating Arrangement",
      "Exhibition",
    ];
    if (eventType && !validEventTypes.includes(eventType)) {
      errors.push("Invalid eventType value");
    }

    // Date/Time Logic
    const finalStartDate = startDate || existingEvent.startDate;
    const finalEndDate = endDate || existingEvent.endDate;
    const finalStartTime = startTime || existingEvent.startTime;
    const finalEndTime = endTime || existingEvent.endTime;

    const parseDateTime = (date, time) => {
      if (!date || !time) return new Date(NaN);
      const datePart =
        date instanceof Date ? date.toISOString().split("T")[0] : date;
      return new Date(`${datePart}T${time}`);
    };

    const sDateTime = parseDateTime(finalStartDate, finalStartTime);
    const eDateTime = parseDateTime(finalEndDate, finalEndTime);

    if (isNaN(sDateTime.getTime()) || isNaN(eDateTime.getTime())) {
      errors.push("Invalid date or time format.");
    } else if (eDateTime <= sDateTime) {
      errors.push("End date must be strictly after start date.");
    }



    /* =========================
        DATA PROCESSING
    ========================= */
    image = req.file ? req.file.filename : image || existingEvent.image;
    const finalVenue = venue || existingEvent.venue;
    let finalPriceLevels = Array.isArray(priceLevels)
      ? priceLevels
      : existingEvent.priceLevels || [];
    let finalSeatMap = seatMap !== undefined ? seatMap : existingEvent.seatMap;
    let finalBooths =
      booths !== undefined ? booths : existingEvent.booths || [];

    // Map to track input IDs and names to final ObjectIds
    const idMap = {};

    // Process Price Levels
    if (finalPriceLevels.length > 0) {
      finalPriceLevels = finalPriceLevels.map((p) => {
        const inputId = p._id || p.id;
        const isValidId = inputId && mongoose.Types.ObjectId.isValid(inputId);
        const newId = isValidId
          ? toObjectId(inputId)
          : new mongoose.Types.ObjectId();

        if (inputId) {
          idMap[inputId.toString()] = newId.toString();
        }
        if (p.priceName) {
          idMap[p.priceName] = newId.toString();
        }

        // Recover quantitySold from existing event if missing in payload
        let qSold = Number(p.quantitySold);
        if (isNaN(qSold)) {
          const existing = existingEvent.priceLevels.find(
            (ep) =>
              (ep._id && ep._id.toString() === inputId?.toString()) ||
              ep.priceName === p.priceName,
          );
          qSold = existing ? existing.quantitySold : 0;
        }

        const qAvailable = Number(p.quantityAvailable || 0);
        let finalQAvailable = qAvailable;

        // Auto-sync quantityAvailable with map count for seated/exhibition events
        if (finalEventType !== "General Admission") {
          const placedCount = (layoutData?.items || []).filter(item => 
            (item.categoryId?.toString() === inputId?.toString() || item.categoryId === p.priceName)
          ).length;
          
          if (placedCount > finalQAvailable) {
            finalQAvailable = placedCount;
          }
        }

        if (finalQAvailable < qSold) {
          errors.push(
            `Price level ${p.priceName || ""} capacity (${finalQAvailable}) cannot be less than sold tickets (${qSold}).`,
          );
        }

        return {
          ...p,
          _id: newId,
          facePrice: Number(p.facePrice || 0),
          serviceCharge: Number(p.serviceCharge || 0),
          quantityAvailable: finalQAvailable,
          quantitySold: qSold,
          isActive: p.isActive !== false,
        };
      });
    }

    console.log("updateEvent idMap:", idMap);

    const priceLevelIdStrings = finalPriceLevels
      .map((p) => p._id?.toString())
      .filter(Boolean);

    console.log("updateEvent priceLevelIdStrings:", priceLevelIdStrings);

    // Smart Seating Validation
    if (finalEventType === "Seating Arrangement" && finalSeatMap?.sections) {
      finalSeatMap.sections.forEach((section, sIndex) => {
        section.seats?.forEach((seat, i) => {
          if (!seat.priceLevelId || seat.priceLevelId === "none") {
            seat.priceLevelId = "none";
          } else {
            const seatPillarId = seat.priceLevelId.toString();
            // Check if it's in our mapping or already a valid ID in the list
            const finalId = idMap[seatPillarId] || seatPillarId;
            
            if (!priceLevelIdStrings.includes(finalId)) {
              errors.push(
                `seatMap.sections[${sIndex}].seats[${i}] invalid priceLevelId (${seatPillarId})`,
              );
            }
            seat.priceLevelId = toObjectId(finalId);
          }
        });
      });
    }

    // Booths Logic
    if (Array.isArray(finalBooths) && finalBooths.length > 0) {
      finalBooths.forEach((b, i) => {
        if (!b.priceLevelId || b.priceLevelId === "none") {
          b.priceLevelId = "none";
        } else {
          const boothPidString = b.priceLevelId.toString();
          const finalId = idMap[boothPidString] || boothPidString;

          if (!priceLevelIdStrings.includes(finalId)) {
            errors.push(`booths[${i}] invalid priceLevelId (${boothPidString})`);
          }
          b.priceLevelId = toObjectId(finalId);
        }
      });
    }

    if (errors.length) {
      console.log("Validation errors in updateEvent:", errors);
      return res.status(400).json({
        error: "Validation failed",
        message: errors.join(", "),
        fields: errors,
      });
    }

    // Image Cleanup
    let finalImage = existingEvent.image;
    if (req.file) {
      finalImage = req.file.filename;
      const filePath = path.join(__dirname, "..", "uploads", req.file.filename);
      await optimizeImage(filePath);
      removeEventImage(existingEvent.image);
    } else if (req.body.image === "" || req.body.image === null) {
      finalImage = null;
      removeEventImage(existingEvent.image);
    }

    /* =========================
        STATUS LOGIC
    ========================= */
    let finalStatus = status || existingEvent.status;
    if (existingEvent.status === "completed") {
      return res
        .status(403)
        .json({ error: "Completed events cannot be updated." });
    }

    if (roleLower === "promoter") {
      const sensitiveFields = [
        "title",
        "description",
        "category",
        "venue",
        "startDate",
        "endDate",
        "startTime",
        "endTime",
        "eventType",
        "priceLevels",
        "seatMap",
        "booths",
        "image",
        "ticketCategories",
        "layoutData",
      ];
      const isUpdatingSensitiveData = sensitiveFields.some(
        (field) => req.body[field] !== undefined,
      );
      if (
        isUpdatingSensitiveData &&
        (existingEvent.status === "approved" ||
          existingEvent.status === "rejected")
      ) {
        finalStatus = "pending";
      }
    }

    /* =========================
        EXECUTE UPDATE
    ========================= */
    const updatedData = {
      title: title || existingEvent.title,
      description: description || existingEvent.description,
      category: category || existingEvent.category,
      startDate: finalStartDate,
      endDate: finalEndDate,
      startTime: finalStartTime,
      endTime: finalEndTime,
      eventType: finalEventType,
      priceLevels: finalPriceLevels,
      // Clean seatMap if switched to General Admission
      seatMap: finalEventType === "Seating Arrangement" ? finalSeatMap : null,
      booths: finalBooths,
      hasBooths: Array.isArray(finalBooths) && finalBooths.length > 0,
      venue: finalVenue,
      isFeatured: String(isFeatured) === "true",
      image: finalImage,
      assignedPromoters:
        assignedPromoters !== undefined
          ? assignedPromoters
          : existingEvent.assignedPromoters,
      ticketCategories:
        ticketCategories !== undefined
          ? ticketCategories
          : existingEvent.ticketCategories,
      layoutData:
        layoutData !== undefined ? layoutData : existingEvent.layoutData,
      status: finalStatus,
      rejectionReason:
        rejectionReason !== undefined
          ? rejectionReason
          : existingEvent.rejectionReason,
      cancellationReason:
        req.body.cancellationReason !== undefined
          ? req.body.cancellationReason
          : existingEvent.cancellationReason,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true },
    ).populate([
      { path: "createdBy", select: "firstName lastName role email avatar" },
      { path: "assignedPromoters", select: "firstName lastName email avatar" },
    ]);

    // Notification Logic
    const notificationController = require("./notificationController");
    if (finalStatus === "approved" && existingEvent.status !== "approved") {
        const sponsorNotification = await notificationController.createNotification({
            title: `New Event: ${updatedEvent.title}`,
            content: `A new event has been posted. Check it out!`,
            type: "event",
            path: "/sponsor/sponsor-events",
            unread: true,
            createdBy: req.user._id,
            targetRole: "sponsor",
        });
        emitUpdate("newNotification", sponsorNotification);
    } else if (finalStatus === "rejected" && existingEvent.status !== "rejected") {
        const rejectionNotification = await notificationController.createNotification({
            title: `Event Rejected: ${updatedEvent.title}`,
            content: `Reason: ${rejectionReason || 'No reason provided'}`,
            type: "event",
            path: "/promoter/events",
            unread: true,
            userId: updatedEvent.createdBy._id,
            createdBy: req.user._id,
        });
        emitUpdate("newNotification", rejectionNotification);
    }

    emitUpdate("dashboardUpdate");
    res.status(200).json({ event: updatedEvent });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ error: "Server error", message: error.message });
  }
};

const removeEventImage = (filename) => {
  if (!filename) return;

  const filePath = path.join(__dirname, "../uploads/", filename);

  // Check if file exists before trying to delete
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
        else console.log("Old image deleted from server:", filename);
      });
    }
  });
};

const saveVenueLayout = async (req, res) => {
  const { id } = req.params;
  let { items = [] } = req.body;

  try {
    if (typeof items === "string") items = JSON.parse(items);

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const newSeatMap = {
      width: 1400,
      height: 500,
      sections: [{ name: "Main Section", seats: [] }],
      elements: [],
      backgrounds: [],
    };
    const newBooths = [];

    items.forEach((item) => {
      const idProp = item._id || item.id;
      const isValidMongoId = mongoose.Types.ObjectId.isValid(idProp);

      const common = {
        ...(isValidMongoId && { _id: idProp }),
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: item.rotation || 0,
        scaleX: item.scaleX ?? 1,
        scaleY: item.scaleY ?? 1,
        status: item.status || "available",
        // Option B: Preserve occupancy if it exists, otherwise 0
        occupiedSeats: item.occupiedSeats || 0,
        unassignedIndices: item.unassignedIndices || [],
        priceLevelId:
          item.priceLevelId &&
          item.priceLevelId !== "none" &&
          item.priceLevelId !== ""
            ? item.priceLevelId
            : null,
      };

      if (item.type === "Seat" || item.type === "Table") {
        newSeatMap.sections[0].seats.push({
          ...common,
          type: item.type,
          label: item.label || item.code,
          shape: item.shape || (item.type === "Table" ? "Circle" : "Rect"),
          seatCount: item.seatCount || 1,
          color: item.color || "#e0e0e0",
        });
      } else if (item.type === "Booth") {
        newBooths.push({
          ...common,
          type: "Booth",
          code: item.code || item.label,
          label: item.label || item.code,
        });
      } else if (item.type === "Element") {
        newSeatMap.elements.push({
          ...common,
          label: item.label || "Element",
          shape: item.shape || "Rect",
          color: item.color || "#CCCCCC",
        });
      } else if (item.type === "Background" || item.subType === "Image") {
        newSeatMap.backgrounds.push({
          ...common,
          subType: item.subType === "Image" ? "Image" : "Shape",
          imageUrl: item.imageUrl || null,
          color: item.color || "#2196F3",
          opacity: item.opacity ?? 1,
        });
      }
    });

    event.seatMap = newSeatMap;
    event.booths = newBooths;
    event.hasBooths = newBooths.length > 0;

    event.markModified("seatMap");
    event.markModified("booths");

    await event.save();

    if (typeof emitUpdate === "function") emitUpdate("dashboardUpdate");

    return res.status(200).json(event);
  } catch (error) {
    console.error("Save Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const assignPriceLevels = async (req, res) => {
  const { id } = req.params;
  let { seatMap, booths } = req.body;

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (seatMap && seatMap.sections) {
      event.seatMap.sections = seatMap.sections.map((section) => ({
        ...section,
        seats: section.seats.map((seat) => ({
          ...seat,
          status: seat.status || "available",
          occupiedSeats: seat.occupiedSeats || 0,
          // ADD THIS: Ensure gaps are persisted during price assignment
          unassignedIndices: seat.unassignedIndices || [],
          priceLevelId:
            seat.priceLevelId &&
            seat.priceLevelId !== "none" &&
            seat.priceLevelId !== ""
              ? seat.priceLevelId // Note: Mongoose handles string to ObjectId casting if schema is set
              : null,
        })),
      }));

      if (seatMap.elements) event.seatMap.elements = seatMap.elements;
      if (seatMap.backgrounds) event.seatMap.backgrounds = seatMap.backgrounds;
    }

    // 2. Update the Booths Price Levels
    if (Array.isArray(booths)) {
      event.booths = booths.map((booth) => ({
        ...booth,
        status: booth.status || "available",
        priceLevelId:
          booth.priceLevelId &&
          booth.priceLevelId !== "none" &&
          booth.priceLevelId !== ""
            ? booth.priceLevelId
            : null,
      }));
    }

    event.markModified("seatMap");
    event.markModified("booths");

    // Save will trigger the new Revenue calculation logic in the Model
    await event.save();
    return res.status(200).json(event);

    // 3. Notifications (Existing Logic)
    const creatorName = req.user
      ? `${req.user.firstName} ${req.user.lastName}`
      : "Admin";
    // ... notification code ...

    return res.status(200).json(event);
  } catch (error) {
    console.error("Assign Price Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * POST /:id/buy-seats
 * Customer purchases one or more seats by their layoutData item IDs.
 * Body: { seatIds: string[], billingInfo: {...}, amount: {...} }
 */
const buySeats = async (req, res) => {
  const { id } = req.params;
  const { seatIds, billingInfo, amount, paymentMethod } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ error: "seatIds must be a non-empty array" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "No such event" });

    const items = event.layoutData?.items;
    if (!items) return res.status(400).json({ error: "This event has no layout data" });

    const buyerName = req.user.companyName || `${req.user.firstName} ${req.user.lastName}`;
    const buyerEmail = req.user.email || "";
    const ticketIdBase = new mongoose.Types.ObjectId().toString();

    const notFound = [];
    const alreadySold = [];
    const purchasedSeats = [];

    // Build price level map for quick lookup
    const plMap = {};
    event.priceLevels.forEach((pl, idx) => {
      plMap[pl._id.toString()] = idx;
    });
    const plSoldDelta = {}; // categoryId -> increment count

    // Support both layoutData and legacy seatMap
    let layout = event.layoutData;
    if (typeof layout === "string") {
      try {
        layout = JSON.parse(layout);
      } catch (e) {
        layout = null;
      }
    }

    if (layout && Array.isArray(layout.items)) {
      const items = layout.items;
      seatIds.forEach((sid) => {
        const idx = items.findIndex((item) => {
          const isSeatType = (item.type || "").toLowerCase() === "seat" || item.isSeat;
          const isCircle = !item.isBooth && !item.isElement && !item.isBackground && item.type !== "booth";
          const matchesId = String(item._id || item.id) === sid || item.id === sid;
          return (isSeatType || isCircle) && matchesId;
        });

        if (idx === -1) {
          notFound.push(sid);
          return;
        }
        const item = items[idx];

        if (item.status === "sold" || item.status === "reserved" || item.status === "blocked") {
          alreadySold.push(item.label || sid);
          return;
        }

        // Generate a unique Reservation ID for this specific seat
        const resId = new mongoose.Types.ObjectId();

        // Mark sold in layoutData
        event.layoutData.items[idx].status = "sold";
        event.layoutData.items[idx].reservedBy = buyerName;
        event.layoutData.items[idx].reservedByEmail = buyerEmail;
        event.layoutData.items[idx].ticketId = resId.toString();

        // Track price level delta
        const catId = (item.categoryId || item.priceLevelId)?.toString();
        if (catId && plMap[catId] !== undefined) {
          plSoldDelta[catId] = (plSoldDelta[catId] || 0) + 1;
        }

        purchasedSeats.push({ ...item, reservationId: resId });
      });
    } else if (event.seatMap && event.seatMap.sections) {
      // Process using legacy seatMap
      seatIds.forEach((sid) => {
        let found = false;
        event.seatMap.sections.forEach((section) => {
          const seatIdx = section.seats.findIndex((s) => String(s._id || s.id) === sid);
          if (seatIdx !== -1) {
            const seat = section.seats[seatIdx];
            if (seat.status === "sold" || seat.status === "reserved" || seat.status === "blocked") {
              alreadySold.push(seat.label || sid);
            } else {
              const resId = new mongoose.Types.ObjectId();
              seat.status = "sold";
              seat.reservedBy = buyerName;
              seat.reservedByEmail = buyerEmail;
              seat.ticketId = resId.toString(); // Map unique ID to legacy seat too

              const catId = seat.priceLevelId?.toString();
              if (catId && plMap[catId] !== undefined) {
                plSoldDelta[catId] = (plSoldDelta[catId] || 0) + 1;
              }
              purchasedSeats.push({ ...seat, reservationId: resId });
            }
            found = true;
          }
        });
        if (!found) notFound.push(sid);
      });
    } else {
      return res.status(400).json({ error: "This event has no layout data or seat map" });
    }

    if (alreadySold.length > 0) {
      return res.status(409).json({ error: `Some seats are no longer available: ${alreadySold.join(", ")}` });
    }
    if (notFound.length > 0) {
      return res.status(404).json({ error: `Seats not found: ${notFound.join(", ")}` });
    }

    // Create individual Reservation records for each seat
    try {
      const count = purchasedSeats.length;
      const reservationObjects = purchasedSeats.map((seat) => ({
        _id: seat.reservationId,
        user: req.user._id,
        event: id,
        type: 'seat',
        seatIds: [String(seat._id || seat.id)],
        seatLabels: [seat.label || seat.code],
        amount: {
          total: (amount.total || 0) / count,
          subtotal: (amount.subtotal || 0) / count,
          fee: (amount.fee || 0) / count,
          tax: 0
        },
        billingAddress: {
          email: billingInfo?.email || buyerEmail,
          companyName: req.user.companyName || ""
        },
        paymentMethod: paymentMethod || 'invoice',
        poNumber: billingInfo?.poNumber || "",
        status: 'confirmed'
      }));

      await Reservation.insertMany(reservationObjects);
    } catch (resErr) {
      console.error("Failed to create individual reservation records:", resErr);
    }



    // Update quantitySold on priceLevels
    Object.entries(plSoldDelta).forEach(([catId, delta]) => {
      const plIdx = plMap[catId];
      if (plIdx !== undefined) {
        const currentSold = event.priceLevels[plIdx].quantitySold || 0;
        const newSold = currentSold + delta;
        event.priceLevels[plIdx].quantitySold = newSold;
        
        // Ensure quantityAvailable is synced for physical items to prevent validation errors
        if (event.priceLevels[plIdx].quantityAvailable < newSold) {
          event.priceLevels[plIdx].quantityAvailable = newSold;
        }
      }
    });

    // Update Seat Revenue
    const saleTotal = amount?.total || 0;
    event.seatRevenue = (event.seatRevenue || 0) + saleTotal;

    event.markModified("layoutData");
    event.markModified("priceLevels");
    await event.save();

    // Notify admin
    try {
      const notificationController = require("./notificationController");
      const notification = await notificationController.createNotification({
        title: `New Seat Purchase`,
        content: `${buyerName} purchased ${seatIds.length} seat(s) for "${event.title}"`,
        type: "reservation",
        path: "/admin/payments",
        unread: true,
        createdBy: req.user._id,
        targetRole: "admin",
      });
      emitUpdate("newNotification", notification);
    } catch (notifErr) {
      console.error("Seat purchase notification error:", notifErr);
    }

    emitUpdate("dashboardUpdate");

    res.status(201).json({
      message: "Seats purchased successfully",
      ticketIdBase,
      purchasedSeats,
      event,
    });
  } catch (error) {
    console.error("Buy Seats Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const reserveBooth = async (req, res) => {
  const { id } = req.params; // Event ID
  const { boothId, billingAddress, amount, paymentMethod, poNumber } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "No such event" });

    const boothIdStr = String(boothId);

    // Find the booth index - try _id match first, then layout id / label / code
    let boothIndex = event.booths.findIndex(
      (b) => String(b._id) === boothIdStr,
    );

    if (boothIndex === -1) {
      // Fallback: search by label or code (common when IDs shift during layout saves)
      boothIndex = event.booths.findIndex(
        (b) => b.code === boothIdStr || b.label === boothIdStr,
      );
    }

    if (boothIndex === -1 && event.layoutData?.items) {
      // Third attempt: find the item in layoutData to get its label/code, then match that back to booths
      const layoutItem = event.layoutData.items.find(
        (item) => String(item._id || item.id) === boothIdStr,
      );
      if (layoutItem) {
        const identifier = layoutItem.code || layoutItem.label;
        boothIndex = event.booths.findIndex(
          (b) => b.code === identifier || b.label === identifier,
        );
      }
    }

    if (boothIndex === -1) {
      return res.status(404).json({ error: "Booth not found in this event" });
    }

    const booth = event.booths[boothIndex];

    // Check if available - with double-check for desyncs
    if (booth.status !== "available") {
      // DOUBLE CHECK: Is there actually an active reservation for this booth?
      // We check by both ID and code to be safe against layout reshuffles.
      const existingRes = await Reservation.findOne({
        event: id,
        $or: [
          { boothId: booth._id },
          { boothCode: booth.label || booth.code }
        ],
        status: { $ne: "cancelled" }
      });

      if (existingRes) {
        return res.status(400).json({ error: "Booth is no longer available" });
      } else {
        // If no reservation exists, it was a desync (likely from a failed previous attempt or manual database edit).
        // We heal the status locally and proceed.
        console.warn(`Desync detected: Booth ${booth.label || booth.code} was marked ${booth.status} but no active reservation exists. Proceeding with healing.`);
        event.booths[boothIndex].status = "available";
      }
    }

    // Check Price Level capacity early
    let plIndex = -1;
    if (booth.priceLevelId && booth.priceLevelId !== "none") {
      plIndex = event.priceLevels.findIndex(
        (pl) => pl._id.toString() === booth.priceLevelId.toString(),
      );
      if (plIndex !== -1) {
        const pl = event.priceLevels[plIndex];
        
        // Auto-expand quantityAvailable if it's desynced from the map's inventory
        // Since this is a physical booth, the map is the source of truth.
        if (pl.quantityAvailable <= pl.quantitySold) {
            event.priceLevels[plIndex].quantityAvailable = pl.quantitySold + 1;
        }
      }
    }

    // 1. Create the Reservation record
    const reservation = await Reservation.create({
      user: req.user._id,
      event: id,
      boothId: booth._id,
      boothCode: booth.label || booth.code,
      amount,
      billingAddress,
      paymentMethod: paymentMethod || "invoice",
      poNumber: poNumber || "",
      status: "confirmed", // Auto-confirmed for invoice/sample flow
    });

    // 2. Update the booth status and Price Level stats in the Event
    const buyerName =
      req.user.companyName || `${req.user.firstName} ${req.user.lastName}`;
    
    event.booths[boothIndex].status = "sold";
    event.booths[boothIndex].reservedBy = buyerName;
    event.booths[boothIndex].reservedByEmail = req.user.email || "";
    event.booths[boothIndex].reservedByPO = poNumber || "";

    // Update Revenue
    const saleTotal = amount?.total || 0;
    event.boothRevenue = (event.boothRevenue || 0) + saleTotal;

    // Update Price Level stats if found
    if (plIndex !== -1) {
      event.priceLevels[plIndex].quantitySold += 1;
    }

    // Also update layoutData if it exists
    if (event.layoutData && event.layoutData.items) {
      const layoutItemIndex = event.layoutData.items.findIndex(
        (item) =>
          String(item._id || item.id) === boothIdStr &&
          (item.type || "").toLowerCase() === "booth",
      );
      if (layoutItemIndex !== -1) {
        event.layoutData.items[layoutItemIndex].status = "sold";
        event.layoutData.items[layoutItemIndex].reservedBy = buyerName;
        event.layoutData.items[layoutItemIndex].reservedByEmail =
          req.user.email || "";
        event.layoutData.items[layoutItemIndex].reservedByPO = poNumber || "";
        event.markModified("layoutData");
      }
    }

    // Single save for all changes
    event.markModified("booths");
    event.markModified("priceLevels");
    await event.save();

    // 4. Create Notification for Admins
    const notificationController = require("./notificationController");
    const sponsorName =
      req.user.companyName || `${req.user.firstName} ${req.user.lastName}`;

    const notification = await notificationController.createNotification({
      title: `New Booth Reservation`,
      content: `${sponsorName} reserved booth ${booth.label || booth.code} for event "${event.title}"`,
      type: "reservation",
      path: "/admin/payments",
      unread: true,
      createdBy: req.user._id,
      targetRole: "admin",
    });
    emitUpdate("newNotification", notification);

    // 5. Notification for the Sponsor (Success)
    const sponsorNotification = await notificationController.createNotification({
      title: `Reservation Success!`,
      content: `Your reservation for booth ${booth.label || booth.code} in "${event.title}" has been confirmed.`,
      type: "reservation",
      path: "/sponsor/my-booth",
      unread: true,
      userId: req.user._id,
      createdBy: req.user._id
    });
    emitUpdate("newNotification", sponsorNotification);

    emitUpdate("dashboardUpdate");

    res.status(201).json({
      message: "Booth reserved successfully",
      reservation,
      event,
    });
  } catch (error) {
    console.error("Reserve Booth Error:", error);
    
    // Notification for the Sponsor (Error/Failure)
    try {
        const notificationController = require("./notificationController");
        await notificationController.createNotification({
            title: `Reservation Failed`,
            content: `We encountered an error while processing your reservation: ${error.message}`,
            type: "reservation",
            path: "/sponsor/sponsor-events",
            unread: true,
            userId: req.user._id,
            createdBy: req.user._id
        });
        emitUpdate("newNotification", { userId: req.user._id }); // Trigger refresh
    } catch (notifError) {
        console.error("Failed to create error notification:", notifError);
    }

    res.status(500).json({ error: error.message });
  }
};

const syncBoothStatus = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "No such event" });

    // 1. Get all active (non-cancelled) reservations for this event and populate user details
    const reservations = await Reservation.find({ 
      event: id,
      status: { $ne: 'cancelled' } 
    }).populate(
      "user",
      "firstName lastName companyName email",
    );

    let changed = false;

    // 2. Sync the booths array
    if (event.booths && event.booths.length > 0) {
      event.booths.forEach((booth, index) => {
        const idStr = (booth._id || "").toString();
        const res = reservations.find(
          (r) =>
            r.type === 'booth' && (
              (r.boothId && r.boothId.toString() === idStr) ||
              r.boothCode === booth.code ||
              r.boothCode === booth.label
            )
        );

        const isReserved = !!res;
        const buyerName =
          res && res.user
            ? res.user.companyName ||
              `${res.user.firstName} ${res.user.lastName}`
            : "";
        const buyerEmail =
          res && res.user ? res.user.email : res?.billingAddress?.email || "";
        const buyerPO = res ? res.poNumber || "" : "";

        if (isReserved) {
          if (
            booth.status !== "sold" ||
            booth.reservedBy !== buyerName ||
            booth.reservedByEmail !== buyerEmail
          ) {
            event.booths[index].status = "sold";
            event.booths[index].reservedBy = buyerName;
            event.booths[index].reservedByEmail = buyerEmail;
            event.booths[index].reservedByPO = buyerPO;
            changed = true;
          }
        } else if (booth.status === "sold") {
          event.booths[index].status = "available";
          event.booths[index].reservedBy = "";
          event.booths[index].reservedByEmail = "";
          event.booths[index].reservedByPO = "";
          changed = true;
        }
      });
    }

    // 3. Sync layoutData items independently
    if (event.layoutData && event.layoutData.items) {
      event.layoutData.items.forEach((item, index) => {
        const type = (item.type || "").toLowerCase();
        const idStr = (item._id || item.id || "").toString();

        if (type === "booth") {
          const res = reservations.find(
            (r) =>
              r.type === 'booth' && (
                (r.boothId && r.boothId.toString() === idStr) ||
                r.boothCode === item.code ||
                r.boothCode === item.label
              )
          );

          const isReserved = !!res;
          const buyerName =
            res && res.user
              ? res.user.companyName ||
                `${res.user.firstName} ${res.user.lastName}`
              : "";
          const buyerEmail =
            res && res.user ? res.user.email : res?.billingAddress?.email || "";
          const buyerPO = res ? res.poNumber || "" : "";

          if (isReserved) {
            if (
              item.status !== "sold" ||
              item.reservedBy !== buyerName ||
              item.reservedByEmail !== buyerEmail
            ) {
              event.layoutData.items[index].status = "sold";
              event.layoutData.items[index].reservedBy = buyerName;
              event.layoutData.items[index].reservedByEmail = buyerEmail;
              event.layoutData.items[index].reservedByPO = buyerPO;
              changed = true;
              event.markModified("layoutData");
            }
          } else if (item.status === "sold") {
            event.layoutData.items[index].status = "available";
            event.layoutData.items[index].reservedBy = "";
            event.layoutData.items[index].reservedByEmail = "";
            event.layoutData.items[index].reservedByPO = "";
            changed = true;
            event.markModified("layoutData");
          }
        } else if (type === "seat") {
          const res = reservations.find(
            (r) =>
              r.type === 'seat' && (
                (r.seatIds && r.seatIds.includes(idStr)) ||
                (r.seatLabels && (r.seatLabels.includes(item.label) || r.seatLabels.includes(item.code)))
              )
          );

          const isReserved = !!res;
          const buyerName =
            res && res.user
              ? res.user.companyName ||
                `${res.user.firstName} ${res.user.lastName}`
              : "";
          const buyerEmail =
            res && res.user ? res.user.email : res?.billingAddress?.email || "";
          const buyerPO = res ? res.poNumber || "" : "";

          if (isReserved) {
            if (
              item.status !== "sold" ||
              item.reservedBy !== buyerName ||
              item.reservedByEmail !== buyerEmail
            ) {
              event.layoutData.items[index].status = "sold";
              event.layoutData.items[index].reservedBy = buyerName;
              event.layoutData.items[index].reservedByEmail = buyerEmail;
              event.layoutData.items[index].reservedByPO = buyerPO;
              changed = true;
              event.markModified("layoutData");
            }
          } else if (item.status === "sold") {
            // Only reset if it's not a ticket-purchased seat (which would have a ticketId)
            // If the user wants to clear EVERYTHING that isn't in active reservations, they can do that,
            // but usually tickets are separate from "reservations".
            // However, based on the codebase, tickets seem to be handled as 'seat' type reservations too (buySeats).
            if (!item.ticketId) {
                event.layoutData.items[index].status = "available";
                event.layoutData.items[index].reservedBy = "";
                event.layoutData.items[index].reservedByEmail = "";
                event.layoutData.items[index].reservedByPO = "";
                changed = true;
                event.markModified("layoutData");
            }
          }
        }
      });
    }

    // 4. Recalculate quantitySold for price levels
    event.priceLevels.forEach((pl, index) => {
      // For booths
      const soldBooths = event.booths.filter(
        (b) =>
          b.priceLevelId?.toString() === pl._id.toString() &&
          b.status === "sold",
      ).length;

      // For seats in layoutData
      let soldSeats = 0;
      if (event.layoutData && event.layoutData.items) {
          soldSeats = event.layoutData.items.filter(
              (item) => 
                (item.type || "").toLowerCase() === "seat" && 
                (item.categoryId?.toString() === pl._id.toString() || item.priceLevelId?.toString() === pl._id.toString()) &&
                item.status === "sold"
          ).length;
      }

      const totalSold = soldBooths + soldSeats;
      
      if (pl.quantitySold !== totalSold) {
        event.priceLevels[index].quantitySold = totalSold;
        changed = true;
      }
    });

    if (changed) {
      event.markModified("booths");
      event.markModified("priceLevels");
      await event.save();
    }

    const { emitUpdate } = require("../socket");
    emitUpdate("dashboardUpdate");

    res.status(200).json({
      message: "Sync completed",
      changed,
      event: event, // Return the full updated event
    });

  } catch (error) {
    console.error("Sync Booth Error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  deleteEvent,
  updateEvent,
  saveVenueLayout,
  assignPriceLevels,
  buySeats,
  reserveBooth,
  syncBoothStatus,
  upload,
};
