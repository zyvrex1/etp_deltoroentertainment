const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Event = require("../models/eventModel");
const Reservation = require("../models/reservationModel");
const { toObjectId } = require("../utils/helpers");

const fs = require('fs');
const path = require('path');
const multer = require("multer");
const { emitUpdate } = require("../socket");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const cleanName = originalName.replace(/\s+/g, '-').toLowerCase();

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');

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
            { assignedPromoters: user._id, status: "approved" }
          ]
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
        eventsQuery = Event.find({ status: { $in: allowedPublicStatus } }).sort({ createdAt: -1 });
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
    const events = await eventsQuery.populate([
      {
        path: "createdBy",
        select: "firstName lastName role email avatar companyName",
      },
      {
        path: "assignedPromoters",
        select: "firstName lastName email avatar",
      }
    ]);

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
          { status: { $in: ["approved", "completed"] } }
        ]
      });
    } else {
      // Guest, Customer, or Sponsor can see approved/completed events
      eventQuery = Event.findOne({
        _id: id,
        status: { $in: ["approved", "completed"] }
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
      }
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
      console.error("Warning: Failed to auto-update event status:", saveError.message);
      // We don't crash the request because the event still exists and is fetched.
    }

    return res.status(200).json(event);
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
      eventType,
      priceLevels = [],
      seatMap = null,
      booths = [],
      isFeatured = false,
    } = req.body;

    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

    const image = req.file ? req.file.filename : null;
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

    if (eventType === "General Admission" && priceLevels.length > 2) {
      errors.push("General Admission allows maximum of 2 price levels only");
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
    const priceLevelIdStrings = (priceLevels || []).map((p) => p._id?.toString()).filter(Boolean);

    // 2. Seating Arrangement Logic
    if (eventType === "Seating Arrangement" && seatMap) {
      seatMap.sections?.forEach((section, sIndex) => {
        section.seats?.forEach((seat, i) => {
          const seatPillarId = seat.priceLevelId?.toString();

          if (seatPillarId) {
            // If it's not "none", validate it against your actual price levels
            if (seatPillarId !== "none" && priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(seatPillarId)) {
              errors.push(`seatMap.sections[${sIndex}].seats[${i}].invalidPriceLevelId`);
            }

            // THE FIX: If it's "none", keep it as "none". Otherwise, convert to ObjectId.
            seat.priceLevelId = seat.priceLevelId === "none" ? "none" : toObjectId(seat.priceLevelId);
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
          if (boothPidString !== "none" && priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(boothPidString)) {
            errors.push(`booths[${i}].invalidPriceLevelId`);
          }

          // THE FIX: Apply the same logic for booths
          b.priceLevelId = b.priceLevelId === "none" ? "none" : toObjectId(b.priceLevelId);
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
      const notificationController = require('./notificationController');
      const creatorName = populatedEvent.createdBy ? `${populatedEvent.createdBy.firstName} ${populatedEvent.createdBy.lastName}` : "A promoter";
      const notification = await notificationController.createNotification({
        title: `New event "${title}" pending approval`,
        content: `submitted by ${creatorName}`,
        type: 'event',
        path: '/admin/events',
        unread: true,
        createdBy: populatedEvent.createdBy ? populatedEvent.createdBy._id : null,
        targetRole: 'admin'
      });
      emitUpdate('newNotification', notification);
    }

    emitUpdate('dashboardUpdate');
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
  const notificationController = require('./notificationController');
  const creatorName = `${req.user.firstName} ${req.user.lastName}`;

  // 1. System notification for admins
  const adminNotification = await notificationController.createNotification({
    title: `${creatorName} deleted event: ${event.title}`,
    content: `The event has been permanently removed.`,
    type: 'event',
    path: '/admin/events',
    unread: true,
    createdBy: req.user._id,
    targetRole: 'admin'
  });
  emitUpdate('newNotification', adminNotification);

  // 2. Notifications for assigned promoters
  if (event.assignedPromoters && event.assignedPromoters.length > 0) {
    for (const promoterId of event.assignedPromoters) {
      const promoterNotification = await notificationController.createNotification({
        title: `Event Deleted: ${event.title}`,
        content: `An event you were assigned to has been deleted by ${creatorName}.`,
        type: 'event',
        path: '/promoter/promoter-eventmanagement',
        unread: true,
        userId: promoterId,
        createdBy: req.user._id
      });
      emitUpdate('newNotification', promoterNotification);
    }
  }

  emitUpdate('dashboardUpdate');
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
      title, description, category, venue,
      startDate, endDate, startTime, endTime,
      eventType, priceLevels, seatMap, booths,
      isFeatured, image, assignedPromoters,
      ticketCategories, layoutData,
      status, rejectionReason,
    } = req.body;

    const roleLower = (req.user.role || "").toLowerCase();
    const isOwner = String(existingEvent.createdBy) === String(req.user._id);
    const isAdmin = roleLower === 'admin' || roleLower === 'superadmin';

    // 🛑 Restriction: Only owner or admin can manage the promoter team
    if (assignedPromoters !== undefined && !isOwner && !isAdmin) {
      return res.status(403).json({ error: "Permission denied. Only the event creator can manage the promoter team." });
    }

    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);
    if (typeof ticketCategories === "string") ticketCategories = JSON.parse(ticketCategories);
    if (typeof layoutData === "string") layoutData = JSON.parse(layoutData);

    const errors = [];
    const finalEventType = eventType || existingEvent.eventType;

    // Check required fields
    const fieldsToCheck = ["title", "description", "category"];
    fieldsToCheck.forEach(field => {
      if (req.body[field] !== undefined && String(req.body[field]).trim() === "") {
        errors.push(`${field} cannot be empty`);
      }
    });



    /* =========================
        DATE & TIME VALIDATION
    ========================= */
    // Use the values from req.body or fallback to existing event values
    const finalStartDate = startDate || existingEvent.startDate;
    const finalEndDate = endDate || existingEvent.endDate;
    const finalStartTime = startTime || existingEvent.startTime;
    const finalEndTime = endTime || existingEvent.endTime;

    // Construct full Date objects including time for precise comparison
    const parseDateTime = (date, time) => {
      if (!date || !time) return new Date(NaN);
      const datePart = (date instanceof Date) ? date.toISOString().split('T')[0] : date;
      return new Date(`${datePart}T${time}`);
    };

    const sDateTime = parseDateTime(finalStartDate, finalStartTime);
    const eDateTime = parseDateTime(finalEndDate, finalEndTime);

    // If the dates/times are invalid or the end is not after start
    if (isNaN(sDateTime.getTime()) || isNaN(eDateTime.getTime())) {
      errors.push("Invalid date or time format.");
    } else if (eDateTime <= sDateTime) {
      errors.push("End date must be strictly after start date.");
    }

    if (finalEventType === "General Admission" && priceLevels?.length > 10) {
      errors.push("General Admission allows maximum of 10 price levels only");
    }

    image = req.file ? req.file.filename : image || existingEvent.image;
    const finalVenue = venue || existingEvent.venue;
    let finalPriceLevels = Array.isArray(priceLevels) ? priceLevels : existingEvent.priceLevels || [];
    let finalSeatMap = seatMap !== undefined ? seatMap : existingEvent.seatMap;
    let finalBooths = booths !== undefined ? booths : (existingEvent.booths || []);

    // Process Price Levels
    if (finalPriceLevels.length > 0) {
      finalPriceLevels = finalPriceLevels.map((p) => {
        const isValidId = p._id && mongoose.Types.ObjectId.isValid(p._id);
        const newId = isValidId ? new mongoose.Types.ObjectId(p._id) : new mongoose.Types.ObjectId();

        const qSold = Number(p.quantitySold || 0);
        const qAvailable = Number(p.quantityAvailable || 0);

        if (qAvailable < qSold) {
          errors.push(`Price level ${p.priceName || ''} cannot have less capacity than tickets already sold.`);
        }

        return {
          ...p,
          _id: newId,
          facePrice: Number(p.facePrice || 0),
          serviceCharge: Number(p.serviceCharge || 0),
          quantityAvailable: qAvailable,
          quantitySold: qSold,
          isActive: p.isActive !== false
        };
      });
    }

    const priceLevelIdStrings = finalPriceLevels
      .map((p) => p._id?.toString())
      .filter(Boolean);

    /* =========================
        SMART SEATING VALIDATION
    ========================= */
    if (finalEventType === "Seating Arrangement" && finalSeatMap?.sections) {
      finalSeatMap.sections.forEach((section, sIndex) => {
        section.seats?.forEach((seat, i) => {
          if (!seat.priceLevelId) {
            // Fallback to "none" instead of pushing an error if you want to allow it
            seat.priceLevelId = "none";
          } else if (seat.priceLevelId !== "none") {
            const seatPillarId = seat.priceLevelId.toString();

            if (priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(seatPillarId)) {
              errors.push(`seatMap.sections[${sIndex}].seats[${i}] has an invalid priceLevelId`);
            }

            // Use your utility to avoid the deprecation warning
            seat.priceLevelId = toObjectId(seat.priceLevelId);
          }
          // If it's "none", we do nothing (it stays a string "none")
        });
      });
    }

    // Process Booths similarly
    if (Array.isArray(finalBooths) && finalBooths.length > 0) {
      finalBooths.forEach((b, i) => {
        if (!b.priceLevelId) {
          b.priceLevelId = "none";
        } else if (b.priceLevelId !== "none") {
          const boothPidString = b.priceLevelId.toString();

          if (priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(boothPidString)) {
            errors.push(`booths[${i}].invalidPriceLevelId`);
          }

          // Use your utility here too
          b.priceLevelId = toObjectId(b.priceLevelId);
        }
      });
    }

    if (errors.length) {
      console.error("Event Update Validation Failed:", errors);
      return res.status(400).json({
        error: "Validation failed",
        message: errors.join(", "),
        fields: errors
      });
    }

    let finalImage = existingEvent.image;

    if (req.file) {
      // A new file was uploaded - Replace the old one
      finalImage = req.file.filename;
      // OPTIONAL: Call a function here to delete the OLD file from 'uploads/'
      removeEventImage(existingEvent.image);
    } else if (req.body.image === "" || req.body.image === null) {
      // The user explicitly removed the image
      finalImage = null;
      removeEventImage(existingEvent.image);
    }

    /* =========================
        ROLE & STATUS LOGIC
    ========================= */
    let finalStatus = status || existingEvent.status;

    // 1. Restriction: Completed events are final
    if (existingEvent.status === "completed") {
      return res.status(403).json({ error: "Completed events cannot be updated." });
    }

    // 2. Restriction: Rejected events are read-only for admins (they must be re-edited by the promoter)
    if (existingEvent.status === "rejected" && (roleLower === "admin" || roleLower === "superadmin")) {
      return res.status(403).json({ error: "Rejected events cannot be updated by administrators. The promoter must resubmit it." });
    }

    if (roleLower === "promoter") {
      // Check if any sensitive fields are being updated (anything other than assignedPromoters)
      const sensitiveFields = [
        'title', 'description', 'category', 'venue',
        'startDate', 'endDate', 'startTime', 'endTime',
        'eventType', 'priceLevels', 'seatMap', 'booths',
        'image', 'ticketCategories', 'layoutData'
      ];

      const isUpdatingSensitiveData = sensitiveFields.some(field => req.body[field] !== undefined);

      // If promoter updates sensitive details of an approved or rejected event, it goes back to pending
      if (isUpdatingSensitiveData && (existingEvent.status === "approved" || existingEvent.status === "rejected")) {
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
      startDate: finalStartDate, // Keep as date string
      endDate: finalEndDate,     // Keep as date string
      startTime: finalStartTime,
      endTime: finalEndTime,
      eventType: finalEventType,
      priceLevels: finalPriceLevels,
      seatMap: finalEventType === "General Admission" ? null : finalSeatMap,
      booths: finalBooths,
      hasBooths: Array.isArray(finalBooths) && finalBooths.length > 0,
      venue: finalVenue,
      isFeatured: String(isFeatured) === "true",
      image: finalImage,
      assignedPromoters: assignedPromoters !== undefined ? assignedPromoters : existingEvent.assignedPromoters,
      ticketCategories: ticketCategories !== undefined ? ticketCategories : existingEvent.ticketCategories,
      layoutData: layoutData !== undefined ? layoutData : existingEvent.layoutData,
      status: finalStatus,
      rejectionReason: rejectionReason !== undefined ? rejectionReason : existingEvent.rejectionReason,
      cancellationReason: req.body.cancellationReason !== undefined ? req.body.cancellationReason : existingEvent.cancellationReason,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    ).populate([
      { path: "createdBy", select: "firstName lastName role email avatar" },
      { path: "assignedPromoters", select: "firstName lastName email avatar" }
    ]);

    const notificationController = require('./notificationController');
    const socket = require('../socket');
    const creatorName = `${req.user.firstName} ${req.user.lastName}`;

    let notifTitle = `${creatorName} updated event: ${updatedEvent.title}`;
    let notifContent = `Event details have been modified.`;

    // Special messaging for status changes
    if (existingEvent.status !== updatedEvent.status) {
      if (updatedEvent.status === 'approved') {
        notifTitle = `${creatorName} approved event: ${updatedEvent.title}`;
        notifContent = `The event is now live.`;
      } else if (updatedEvent.status === 'rejected') {
        notifTitle = `${creatorName} rejected event: ${updatedEvent.title}`;
        notifContent = `Approval was declined for this event.`;
      }
    }

    // 1. Admin/System Notification
    const adminNotification = await notificationController.createNotification({
      title: notifTitle,
      content: notifContent,
      type: 'event',
      path: '/admin/events',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'admin'
    });
    emitUpdate('newNotification', adminNotification);

    // 2. Promoter Notifications
    const oldPromoters = (existingEvent.assignedPromoters || []).map(id => id.toString());
    const newPromoters = (updatedEvent.assignedPromoters || []).map(p => (p._id || p).toString());

    const addedPromoters = newPromoters.filter(id => !oldPromoters.includes(id));
    const removedPromoters = oldPromoters.filter(id => !newPromoters.includes(id));
    const maintainedPromoters = newPromoters.filter(id => oldPromoters.includes(id));

    // Notify newly assigned promoters
    for (const promoterId of addedPromoters) {
      const notif = await notificationController.createNotification({
        title: `New Event Assigned: ${updatedEvent.title}`,
        content: `You have been assigned to promote this event by ${creatorName}.`,
        type: 'event',
        path: '/promoter/promoter-eventmanagement',
        unread: true,
        userId: promoterId,
        createdBy: req.user._id
      });
      emitUpdate('newNotification', notif);
    }

    // Notify unassigned promoters
    for (const promoterId of removedPromoters) {
      const notif = await notificationController.createNotification({
        title: `Event Unassigned: ${updatedEvent.title}`,
        content: `You are no longer assigned to promote this event.`,
        type: 'event',
        path: '/promoter/promoter-eventmanagement',
        unread: true,
        userId: promoterId,
        createdBy: req.user._id
      });
      emitUpdate('newNotification', notif);
    }

    // Notify maintained promoters about updates
    for (const promoterId of maintainedPromoters) {
      const notif = await notificationController.createNotification({
        title: `Update on Assigned Event: ${updatedEvent.title}`,
        content: notifContent,
        type: 'event',
        path: '/promoter/promoter-eventmanagement',
        unread: true,
        userId: promoterId,
        createdBy: req.user._id
      });
      emitUpdate('newNotification', notif);
    }

    // 3. Notify Event Creator (if they are a promoter and status changed)
    if (existingEvent.status !== updatedEvent.status && updatedEvent.createdBy) {
      const ownerId = updatedEvent.createdBy._id || updatedEvent.createdBy;
      // Only notify if someone else (like an admin) changed the status
      if (String(ownerId) !== String(req.user._id)) {
        const isApproved = updatedEvent.status === 'approved';
        const isRejected = updatedEvent.status === 'rejected';

        let ownerTitle = `Event Status Update: ${updatedEvent.title}`;
        let ownerMessage = `Your event status has been updated to ${updatedEvent.status}.`;

        if (isApproved) {
          ownerTitle = `Event Approved: ${updatedEvent.title}`;
          ownerMessage = `Great news! Your event was accepted and is now live.`;
        } else if (isRejected) {
          ownerTitle = `Event Declined: ${updatedEvent.title}`;
          ownerMessage = `Your event was not approved at this time.`;
        }

        const ownerNotif = await notificationController.createNotification({
          title: ownerTitle,
          content: ownerMessage,
          type: 'event',
          path: '/promoter/promoter-events',
          unread: true,
          userId: ownerId,
          createdBy: req.user._id
        });
        emitUpdate('newNotification', ownerNotif);
      }
    }

    emitUpdate('dashboardUpdate');
    res.status(200).json({ event: updatedEvent });

  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({
      error: "Server error while updating event",
      message: error.message,
    });
  }
};

const removeEventImage = (filename) => {
  if (!filename) return;

  const filePath = path.join(__dirname, '../uploads/', filename);

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
        priceLevelId: (item.priceLevelId && item.priceLevelId !== "none" && item.priceLevelId !== "")
          ? item.priceLevelId : null
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
      }
      else if (item.type === "Booth") {
        newBooths.push({
          ...common,
          type: "Booth",
          code: item.code || item.label,
          label: item.label || item.code,
        });
      }
      else if (item.type === "Element") {
        newSeatMap.elements.push({
          ...common,
          label: item.label || "Element",
          shape: item.shape || "Rect",
          color: item.color || "#CCCCCC"
        });
      }
      else if (item.type === "Background" || item.subType === "Image") {
        newSeatMap.backgrounds.push({
          ...common,
          subType: item.subType === "Image" ? "Image" : "Shape",
          imageUrl: item.imageUrl || null,
          color: item.color || "#2196F3",
          opacity: item.opacity ?? 1
        });
      }
    });

    event.seatMap = newSeatMap;
    event.booths = newBooths;
    event.hasBooths = newBooths.length > 0;

    event.markModified('seatMap');
    event.markModified('booths');

    await event.save();

    if (typeof emitUpdate === 'function') emitUpdate('dashboardUpdate');

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
          priceLevelId: (seat.priceLevelId && seat.priceLevelId !== "none" && seat.priceLevelId !== "")
            ? seat.priceLevelId // Note: Mongoose handles string to ObjectId casting if schema is set
            : null
        }))
      }));

      if (seatMap.elements) event.seatMap.elements = seatMap.elements;
      if (seatMap.backgrounds) event.seatMap.backgrounds = seatMap.backgrounds;
    }

    // 2. Update the Booths Price Levels
    if (Array.isArray(booths)) {
      event.booths = booths.map((booth) => ({
        ...booth,
        status: booth.status || "available",
        priceLevelId: (booth.priceLevelId && booth.priceLevelId !== "none" && booth.priceLevelId !== "")
          ? booth.priceLevelId
          : null
      }));
    }

    event.markModified('seatMap');
    event.markModified('booths');

    // Save will trigger the new Revenue calculation logic in the Model
    await event.save();
    return res.status(200).json(event);

    // 3. Notifications (Existing Logic)
    const creatorName = req.user ? `${req.user.firstName} ${req.user.lastName}` : "Admin";
    // ... notification code ...

    return res.status(200).json(event);

  } catch (error) {
    console.error("Assign Price Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const reserveBooth = async (req, res) => {
  const { id } = req.params; // Event ID
  const { boothId, billingAddress, amount, paymentMethod } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ error: "No such event" });

    // Find the booth index - try _id match first, then layout id / label / code
    let boothIndex = event.booths.findIndex(b => b._id.toString() === boothId);

    if (boothIndex === -1) {
      // Fallback: search by label or code (common when IDs shift during layout saves)
      boothIndex = event.booths.findIndex(b => b.code === boothId || b.label === boothId);
    }

    if (boothIndex === -1 && event.layoutData?.items) {
      // Third attempt: find the item in layoutData to get its label/code, then match that back to booths
      const layoutItem = event.layoutData.items.find(item => (item._id?.toString() === boothId || item.id?.toString() === boothId));
      if (layoutItem) {
        const identifier = layoutItem.code || layoutItem.label;
        boothIndex = event.booths.findIndex(b => b.code === identifier || b.label === identifier);
      }
    }

    if (boothIndex === -1) {
      return res.status(404).json({ error: "Booth not found in this event" });
    }

    const booth = event.booths[boothIndex];

    // Check if available
    if (booth.status !== "available") {
      return res.status(400).json({ error: "Booth is no longer available" });
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
      status: "confirmed", // Auto-confirmed for invoice/sample flow
    });

    // 2. Update the booth status in the Event
    // We mark it as 'sold' to show it as Green/Occupied on the map
    const buyerName = req.user.companyName || `${req.user.firstName} ${req.user.lastName}`;
    event.booths[boothIndex].status = "sold";
    event.booths[boothIndex].reservedBy = buyerName;

    // Also update layoutData if it exists
    if (event.layoutData && event.layoutData.items) {
      const layoutItemIndex = event.layoutData.items.findIndex(item => item._id?.toString() === boothId || item.id?.toString() === boothId);
      if (layoutItemIndex !== -1) {
        event.layoutData.items[layoutItemIndex].status = "sold";
        event.layoutData.items[layoutItemIndex].reservedBy = buyerName;
        event.markModified('layoutData');
      }
    }

    await event.save();

    // 3. Update Price Level stats
    if (booth.priceLevelId && booth.priceLevelId !== "none") {
      const plIndex = event.priceLevels.findIndex(pl => pl._id.toString() === booth.priceLevelId.toString());
      if (plIndex !== -1) {
        event.priceLevels[plIndex].quantitySold += 1;
        await event.save();
      }
    }

    emitUpdate('dashboardUpdate');

    res.status(201).json({
      message: "Booth reserved successfully",
      reservation,
      event
    });

  } catch (error) {
    console.error("Reserve Booth Error:", error);
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
  reserveBooth,
  upload,
};
