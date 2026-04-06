const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Event = require("../models/eventModel");
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
        eventsQuery = Event.find({ createdBy: user._id }).sort({
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
      // Public access
      eventsQuery = Event.find({ status: "approved" }).sort({ createdAt: -1 });
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
    const events = await eventsQuery.populate({
      path: "createdBy",
      select: "firstName lastName role",
    });

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

    const event = await eventQuery.populate({
      path: "createdBy",
      select: "firstName lastName role",
    });

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
      "eventType",
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
      seatMap: eventType === "Seating Arrangement" ? seatMap : null,
      booths: hasBooths ? booths : [],
      hasBooths,
      isFeatured: Boolean(isFeatured),
      createdBy: userId,
      status,
    });

    const populatedEvent = await newEvent.populate(
      "createdBy",
      "firstName lastName role",
    );

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
      isFeatured, image,
    } = req.body;

    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

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
    const sDateTime = new Date(`${finalStartDate}T${finalStartTime}`);
    const eDateTime = new Date(`${finalEndDate}T${finalEndTime}`);

    // If the dates/times are invalid or the end is not after start
    if (isNaN(sDateTime.getTime()) || isNaN(eDateTime.getTime())) {
      errors.push("Invalid date or time format.");
    } else if (eDateTime <= sDateTime) {
      errors.push("End date must be strictly after start date.");
    }

    if (finalEventType === "General Admission" && priceLevels?.length > 2) {
      errors.push("General Admission allows maximum of 2 price levels only");
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
    if (Array.isArray(finalBooths) && finalEventType === "Booth-Style") {
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
      return res.status(400).json({ error: "Validation failed", fields: errors });
    }

    let finalImage = existingEvent.image;

    if (req.file) {
      // A new file was uploaded - Replace the old one
      finalImage = req.file.filename;
      // OPTIONAL: Call a function here to delete the OLD file from 'uploads/'
      deleteOldImage(existingEvent.image);
    } else if (req.body.image === "" || req.body.image === null) {
      // The user explicitly removed the image
      finalImage = null;
      deleteOldImage(existingEvent.image);
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
      seatMap: finalEventType === "Seating Arrangement" ? finalSeatMap : null,
      booths: finalEventType === "Booth-Style" ? finalBooths : [],
      hasBooths: finalEventType === "Booth-Style" && finalBooths.length > 0,
      venue: finalVenue,
      isFeatured: String(isFeatured) === "true",
      image: finalImage,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName role");

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

const deleteOldImage = (filename) => {
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

const updateSeatMap = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid event ID" });
  }

  try {
    let { seatMap } = req.body;

    // Parse JSON if needed
    if (typeof seatMap === "string") {
      try {
        seatMap = JSON.parse(seatMap);
      } catch {
        return res.status(400).json({ error: "Invalid seatMap JSON" });
      }
    }

    if (!seatMap || typeof seatMap !== "object") {
      return res.status(400).json({ error: "seatMap is required" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.eventType !== "Seating Arrangement") {
      return res.status(400).json({
        error: "Seat map only allowed for Seating Arrangement events",
      });
    }

    /* =========================
       VALIDATE PRICE LEVEL IDS
    ========================= */
    // Note: Ensure your schema uses event.seatPriceLevels or event.priceLevels consistently
    const validPriceLevelIds = event.seatPriceLevels.map((p) =>
      p._id.toString(),
    );

    let invalidSeats = [];

    if (seatMap.sections && Array.isArray(seatMap.sections)) {
      seatMap.sections.forEach((section, sIndex) => {
        if (section.seats && Array.isArray(section.seats)) {
          section.seats.forEach((seat, index) => {
            // 1. Check for seat identifier
            if (!seat.id) {
              invalidSeats.push(`sections[${sIndex}].seats[${index}].id`);
            }

            // 2. Updated Validation Logic for priceLevelId
            // Check if it exists at all
            if (!seat.priceLevelId) {
              invalidSeats.push(
                `sections[${sIndex}].seats[${index}].priceLevelId is missing`
              );
            }
            // If it's NOT "none", then it MUST be a valid ID from the database
            else if (seat.priceLevelId !== "none" && !validPriceLevelIds.includes(seat.priceLevelId)) {
              invalidSeats.push(
                `sections[${sIndex}].seats[${index}].priceLevelId (${seat.priceLevelId}) is INVALID`
              );
            }
          });
        }
      });
    }

    if (invalidSeats.length > 0) {
      return res.status(400).json({
        error: "Invalid seatMap data",
        invalidSeats,
      });
    }

    /* =========================
       SAVE SEAT MAP
    ========================= */
    event.seatMap = seatMap;
    // Explicitly mark the path as modified if seatMap is a deeply nested object
    event.markModified('seatMap');

    await event.save();

    res.status(200).json({
      message: "Seat map updated successfully",
      seatMap: event.seatMap,
    });
  } catch (error) {
    console.error("Update SeatMap Error:", error);
    res.status(500).json({
      error: "Server error while updating seat map",
      message: error.message,
    });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  deleteEvent,
  updateEvent,
  updateSeatMap,
  upload,
};
