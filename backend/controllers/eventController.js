const { v4: uuidv4 } = require("uuid");
const Event = require('../models/eventModel')
const mongoose = require('mongoose')

const multer = require("multer");
const path = require("path");

// Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter (ONLY IMAGES)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPG, PNG, WEBP)"));
  }
};

// Multer upload
const upload = multer({
  storage,
  fileFilter
});


// get all events
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
        eventsQuery = Event.find({ createdBy: user._id }).sort({ createdAt: -1 });
      } else if (role === "customer" || role === "sponsor") {
        eventsQuery = Event.find({ status: "approved" }).sort({ createdAt: -1 });
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
        const [hours, minutes] = event.endTime.split(':').map(Number);
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
        { status: "completed" }
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

// GET a single event
  const getEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  try {
    const user = req.user;
    const role = user.role?.toLowerCase();

    let eventQuery;

    if (role === "superadmin" || role === "admin") {
      eventQuery = Event.findById(id);
    } else if (role === "promoter") {
      eventQuery = Event.findOne({ _id: id, createdBy: user._id });
    } else if (role === "customer" || role === "sponsor") {
      eventQuery = Event.findOne({ _id: id, status: "approved" });
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    const event = await eventQuery.populate({
      path: "createdBy",
      select: "firstName lastName role",
    });

    if (!event) {
      return res.status(404).json({ error: "No such event" });
    }

    // Mark as completed if past due
    if (event.status === "approved" && event.endDate && event.endTime) {
      const now = new Date();
      const [hours, minutes] = event.endTime.split(':').map(Number);
      const endDateTime = new Date(event.endDate);
      endDateTime.setHours(hours, minutes, 0, 0);

      if (endDateTime < now) {
        event.status = "completed";
        await event.save();
      }
    } else if (event.status === "approved" && event.endDate < new Date()) {
      // Fallback
      event.status = "completed";
      await event.save();
    }

    return res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
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

      priceLevels = [],   // ✅ NEW (single source)

      seatMap = null,
      booths = [],

      isFeatured = false
    } = req.body;

    /* =========================
       PARSE JSON (FormData safe)
    ========================= */
    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

    const image = req.file ? req.file.filename : null;

    /* =========================
       REQUIRED FIELD VALIDATION
    ========================= */
    const requiredFields = [
      "title","description","category",
      "startDate","endDate","startTime","endTime","eventType"
    ];

    let errors = [];

    requiredFields.forEach(field => {
      if (!req.body[field] || String(req.body[field]).trim() === "") {
        errors.push(field);
      }
    });

    /* =========================
       VENUE VALIDATION
    ========================= */
    const venueFields = ["name", "address", "city", "zipCode"];
    if (!venue || typeof venue !== "object") {
      venueFields.forEach(f => errors.push(`venue.${f}`));
    } else {
      venueFields.forEach(f => {
        if (!venue[f]) errors.push(`venue.${f}`);
      });
    }

    /* =========================
       PRICE LEVEL VALIDATION
    ========================= */
    if (!priceLevels.length) {
      errors.push("priceLevels required");
    }

    if (eventType === "General Admission" && priceLevels.length > 2) {
      errors.push("General Admission allows maximum of 2 price levels only");
    }

    const priceLevelIds = priceLevels.map(p => p._id || null);

    /* =========================
       SEAT MAP VALIDATION
    ========================= */
    if (eventType === "Seating Arrangement") {
      if (!seatMap) {
        errors.push("seatMap required for Seating Arrangement");
      }

      if (seatMap && (!seatMap.sections || seatMap.sections.length === 0)) {
        errors.push("seatMap.sections");
      }

      seatMap?.sections?.forEach((section, sIndex) => {
        section.seats?.forEach((seat, i) => {

          if (!seat.id) {
            errors.push(`seatMap.sections[${sIndex}].seats[${i}].id`);
          }

          // ✅ Auto assign first price level if missing
          if (priceLevels.length > 0 && !seat.priceLevelId) {
            seat.priceLevelId = priceLevelIds[0];
          }

          if (!priceLevelIds.includes(seat.priceLevelId)) {
            errors.push(`seatMap.sections[${sIndex}].seats[${i}].invalidPriceLevelId`);
          }
        });
      });
    }

    if (eventType === "General Admission" && seatMap) {
      errors.push("seatMap not allowed for General Admission");
    }

    /* =========================
       BOOTH VALIDATION
    ========================= */
    const hasBooths = Array.isArray(booths) && booths.length > 0;

    if (hasBooths) {
      booths.forEach((b, i) => {

        if (!b.id) {
          errors.push(`booths[${i}].id`);
        }

        // ✅ Auto assign first price level
        if (priceLevels.length > 0 && !b.priceLevelId) {
          b.priceLevelId = priceLevelIds[0];
        }

        if (!priceLevelIds.includes(b.priceLevelId)) {
          errors.push(`booths[${i}].invalidPriceLevelId`);
        }
      });
    }

    /* =========================
       RETURN ERRORS
    ========================= */
    if (errors.length) {
      return res.status(400).json({
        error: "Validation failed",
        fields: errors
      });
    }

    /* =========================
       USER INFO
    ========================= */
    const userId = req.user._id;
    const roleLower = (req.user.role || "").toLowerCase();

    const creatorModel =
      roleLower === "superadmin"
        ? "Superadmin"
        : roleLower === "admin"
        ? "Admin"
        : "Promoter";

    const status =
      roleLower === "admin" || roleLower === "superadmin"
        ? "approved"
        : "pending";

    /* =========================
       CREATE EVENT
    ========================= */
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

      // ✅ SINGLE PRICE LEVEL ARRAY
      priceLevels: priceLevels.map(p => ({
        ...p,
        facePrice: Number(p.facePrice),
        serviceCharge: Number(p.serviceCharge || 0),
        quantityAvailable: Number(p.quantityAvailable || 0),
        quantitySold: Number(p.quantitySold || 0),
      })),

      seatMap: eventType === "Seating Arrangement" ? seatMap : null,

      booths: hasBooths ? booths : [],
      hasBooths,

      isFeatured: isFeatured === "true" || isFeatured === true,

      createdBy: userId,
      creatorModel,
      status
    });

    const populatedEvent = await newEvent.populate(
      "createdBy",
      "firstName lastName role"
    );

    return res.status(201).json({ event: populatedEvent });

  } catch (error) {
    console.error("Create Event Error:", error);

    return res.status(500).json({
      error: "Server error while creating event",
      message: error.message
    });
  }
};

// delete a event
const deleteEvent = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such event'})
    }

    const event = await Event.findOneAndDelete({_id: id})

    if (!event) {
        return res.status(404).json({error: 'No such event'})
    }

    res.status(200).json(event)
}

const updateEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such event" });
  }

  try {
    // Fetch existing event
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
      priceLevels, // single unified array
      seatMap,
      booths,
      isFeatured,
      image
    } = req.body;

    // Parse JSON if sent as string (FormData-safe)
    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

    // Update image if new file uploaded
    image = req.file ? req.file.filename : image || existingEvent.image;

    // Merge incoming data with existing data
    const finalEventType = eventType || existingEvent.eventType;
    const finalPriceLevels = Array.isArray(priceLevels) && priceLevels.length > 0
      ? priceLevels
      : existingEvent.priceLevels || [];
    const finalSeatMap = seatMap !== undefined ? seatMap : existingEvent.seatMap;
    const finalBooths = booths !== undefined ? booths : existingEvent.booths;
    const finalVenue = venue !== undefined ? venue : existingEvent.venue;

    const errors = [];

    // =========================
    // REQUIRED FIELD VALIDATION
    // =========================
    const requiredFields = ["title", "description", "category", "startDate", "endDate", "startTime", "endTime"];
    requiredFields.forEach(field => {
      const value = req.body[field] !== undefined ? req.body[field] : existingEvent[field];
      if (!value || String(value).trim() === "") errors.push(field);
    });

    // =========================
    // VENUE VALIDATION
    // =========================
    const venueFields = ["name", "address", "city", "zipCode"];
    venueFields.forEach(f => {
      if (!finalVenue || !finalVenue[f] || String(finalVenue[f]).trim() === "") {
        errors.push(`venue.${f}`);
      }
    });

    // =========================
    // PRICE LEVEL VALIDATION
    // =========================
    if (finalPriceLevels.length === 0) errors.push("priceLevels required");
    if (finalEventType === "General Admission" && finalPriceLevels.length > 2) {
      errors.push("General Admission allows maximum of 2 price levels only");
    }

    // Assign temporary UUIDs for new price levels if missing
    const priceLevelIds = finalPriceLevels.map(p => p._id || uuidv4());
    finalPriceLevels.forEach((p, i) => {
      if (!p._id) p._id = priceLevelIds[i];
      p.facePrice = Number(p.facePrice || 0);
      p.serviceCharge = Number(p.serviceCharge || 0);
      p.quantityAvailable = Number(p.quantityAvailable || 0);
      p.quantitySold = Number(p.quantitySold || 0);
    });

    // =========================
    // SEAT MAP VALIDATION
    // =========================
    if (finalEventType === "Seating Arrangement") {
      if (!finalSeatMap) errors.push("seatMap required for Seating Arrangement");
      else if (!Array.isArray(finalSeatMap.sections) || finalSeatMap.sections.length === 0) {
        errors.push("seatMap.sections");
      } else {
        finalSeatMap.sections.forEach((section, sIndex) => {
          if (!Array.isArray(section.seats)) return;
          section.seats.forEach((seat, i) => {
            if (!seat.id) errors.push(`seatMap.sections[${sIndex}].seats[${i}].id`);
            // Auto assign first price level if missing
            if (finalPriceLevels.length > 0 && !seat.priceLevelId) seat.priceLevelId = priceLevelIds[0];
            if (!priceLevelIds.includes(seat.priceLevelId)) {
              errors.push(`seatMap.sections[${sIndex}].seats[${i}].invalidPriceLevelId`);
            }
          });
        });
      }
    }

    if (finalEventType === "General Admission" && finalSeatMap) {
      errors.push("seatMap not allowed for General Admission");
    }

    // =========================
    // BOOTH VALIDATION
    // =========================
    const hasBooths = Array.isArray(finalBooths) && finalBooths.length > 0;
    if (hasBooths) {
      finalBooths.forEach((b, i) => {
        if (!b.id) errors.push(`booths[${i}].id`);
        // Auto assign first price level if missing
        if (finalPriceLevels.length > 0 && !b.priceLevelId) b.priceLevelId = priceLevelIds[0];
        if (!priceLevelIds.includes(b.priceLevelId)) errors.push(`booths[${i}].invalidPriceLevelId`);
        if (b.priceOverride !== undefined && (isNaN(Number(b.priceOverride)) || Number(b.priceOverride) < 0)) {
          errors.push(`booths[${i}].priceOverride`);
        }
      });
    }

    // Return errors if any
    if (errors.length) return res.status(400).json({ error: "Validation failed", fields: errors });

    // =========================
    // PREPARE UPDATED DATA
    // =========================
    const updatedData = {
      title: title || existingEvent.title,
      description: description || existingEvent.description,
      category: category || existingEvent.category,
      startDate: startDate || existingEvent.startDate,
      endDate: endDate || existingEvent.endDate,
      startTime: startTime || existingEvent.startTime,
      endTime: endTime || existingEvent.endTime,
      eventType: finalEventType,
      priceLevels: finalPriceLevels,
      seatMap: finalEventType === "Seating Arrangement" ? finalSeatMap : null,
      booths: hasBooths ? finalBooths : [],
      hasBooths,
      maxBooths: hasBooths ? finalBooths.length : 0,
      venue: finalVenue,
      isFeatured: ["true", true].includes(isFeatured) || existingEvent.isFeatured,
      image
    };

    // =========================
    // UPDATE EVENT
    // =========================
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id },
      updatedData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ event: updatedEvent });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({
      error: "Server error while updating event",
      message: error.message
    });
  }
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

    // Get event
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only allow for seating arrangement
    if (event.eventType !== "Seating Arrangement") {
      return res.status(400).json({
        error: "Seat map only allowed for Seating Arrangement events",
      });
    }

    /* =========================
       VALIDATE PRICE LEVEL IDS
    ========================= */
    const validPriceLevelIds = event.seatPriceLevels.map((p) =>
      p._id.toString()
    );

    let invalidSeats = [];

    // Validate seats
    if (seatMap.sections && Array.isArray(seatMap.sections)) {
      seatMap.sections.forEach((section, sIndex) => {
        if (section.seats && Array.isArray(section.seats)) {
          section.seats.forEach((seat, index) => {
            if (!seat.id) {
              invalidSeats.push(`sections[${sIndex}].seats[${index}].id`);
            }

            if (!seat.priceLevelId) {
              invalidSeats.push(`sections[${sIndex}].seats[${index}].priceLevelId`);
            } else if (!validPriceLevelIds.includes(seat.priceLevelId)) {
              invalidSeats.push(
                `sections[${sIndex}].seats[${index}].priceLevelId INVALID`
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
}