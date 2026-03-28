const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const Event = require("../models/eventModel");
const { toObjectId } = require("../utils/helpers");

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
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
      const [hours, minutes] = event.endTime.split(":").map(Number);
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
      priceLevels = [],
      seatMap = null,
      booths = [],
      isFeatured = false,
    } = req.body;

    /* =========================
       PARSE JSON (FormData safe)
    ========================= */
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
      // Use optional chaining to prevent "toString of null"
      const seatPillarId = seat.priceLevelId?.toString();

      if (seatPillarId) {
        if (priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(seatPillarId)) {
          errors.push(`seatMap.sections[${sIndex}].seats[${i}].invalidPriceLevelId`);
        }
        // Safely convert to ObjectId
        seat.priceLevelId = toObjectId(seat.priceLevelId);
      }
    });
  });
}

// 3. Booths Logic (Fixed the variable name from priceLevelIds to priceLevelIdStrings)
const hasBooths = Array.isArray(booths) && booths.length > 0;
if (hasBooths) {
  booths.forEach((b, i) => {
    if (b.priceLevelId) {
      const boothPidString = b.priceLevelId.toString();
      
      // Fixed: Using priceLevelIdStrings which actually exists
      if (priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(boothPidString)) {
        errors.push(`booths[${i}].invalidPriceLevelId`);
      }
      
      b.priceLevelId = toObjectId(b.priceLevelId);
    } else if (priceLevelIdStrings.length > 0) {
      // Default to first price level if none provided
      b.priceLevelId = toObjectId(priceLevelIdStrings[0]);
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

    /* =========================
        PARSE JSON (FormData safe)
    ========================= */
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
          // Check if it exists
          if (!seat.priceLevelId) {
             errors.push(`seatMap.sections[${sIndex}].seats[${i}] is missing a priceLevelId`);
          } 
          // If it is NOT "none", validate it against existing IDs
          else if (seat.priceLevelId !== "none") {
            const seatPillarId = seat.priceLevelId.toString();
            if (priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(seatPillarId)) {
              errors.push(`seatMap.sections[${sIndex}].seats[${i}] has an invalid priceLevelId`);
            }
            seat.priceLevelId = new mongoose.Types.ObjectId(seat.priceLevelId);
          }
          // If it IS "none", it passes (kept as string "none")
        });
      });
    }

    // Process Booths similarly
    if (Array.isArray(finalBooths) && finalEventType === "Booth-Style") {
      finalBooths.forEach((b, i) => {
        if (!b.priceLevelId) {
          errors.push(`booth[${i}] is missing a priceLevelId`);
        } else if (b.priceLevelId !== "none") {
          const boothPidString = b.priceLevelId.toString();
          if (priceLevelIdStrings.length > 0 && !priceLevelIdStrings.includes(boothPidString)) {
            errors.push(`booths[${i}].invalidPriceLevelId`);
          }
          b.priceLevelId = new mongoose.Types.ObjectId(b.priceLevelId);
        }
      });
    }

    if (errors.length) {
      return res.status(400).json({ error: "Validation failed", fields: errors });
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
      image,
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true, runValidators: true }
    ).populate("createdBy", "firstName lastName role");

    res.status(200).json({ event: updatedEvent });

  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({
      error: "Server error while updating event",
      message: error.message,
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
