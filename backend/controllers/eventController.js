const Event = require('../models/eventModel')
// const Booth = require("../models/boothModel"); 
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
    const role = user.role?.toLowerCase();

    console.log("Decoded user:", user);

    let eventsQuery;

    if (role === "superadmin" || role === "admin") {
      eventsQuery = Event.find({}).sort({ createdAt: -1 });
    } else if (role === "promoter") {
      eventsQuery = Event.find({ createdBy: user._id }).sort({ createdAt: -1 });
    } else if (role === "customer" || role === "sponsor") {
      eventsQuery = Event.find({ status: "approved" }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    // Populate createdBy to get firstName, lastName, and role
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
      eventType = "General Admission",
      priceLevels,
      seatMap = {},
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
    const requiredFields = ["title", "description", "category", "startDate", "endDate", "startTime", "endTime"];
    let emptyFields = [];

    requiredFields.forEach(field => {
      if (!req.body[field] || String(req.body[field]).trim() === "") {
        emptyFields.push(field);
      }
    });

    /* =========================
       PRICE LEVEL VALIDATION
    ========================= */
    if (!Array.isArray(priceLevels) || priceLevels.length === 0) {
      emptyFields.push("priceLevels");
    } else {
      priceLevels.forEach((p, index) => {
        if (!p.priceName || String(p.priceName).trim() === "") emptyFields.push(`priceLevels[${index}].priceName`);
        if (p.facePrice === undefined || isNaN(Number(p.facePrice))) emptyFields.push(`priceLevels[${index}].facePrice`);
      });
    }

    /* =========================
       SEATING VALIDATION
    ========================= */
    if (eventType === "Seating Arrangement" && (!seatMap || Object.keys(seatMap).length === 0)) {
      emptyFields.push("seatMap");
    }

    /* =========================
       VENUE VALIDATION (Hybrid)
    ========================= */
    const venueFields = ["name", "address", "city", "zipCode"];
    let emptyVenueFields = [];

    if (!venue || typeof venue !== "object") {
      emptyVenueFields = venueFields.map(f => `venue.${f}`);
    } else {
      venueFields.forEach(field => {
        if (!venue[field] || String(venue[field]).trim() === "") emptyVenueFields.push(`venue.${field}`);
      });
      // Keep _id if present (hybrid)
      if (venue._id) {
        venue = {
          _id: venue._id,
          name: venue.name,
          address: venue.address,
          city: venue.city,
          zipCode: venue.zipCode
        };
      }
    }

    /* =========================
       BOOTH VALIDATION
    ========================= */
    let invalidBooths = [];
    if (Array.isArray(booths)) {
      booths.forEach((b, index) => {
        const price = Number(b.price);
        if (b.price !== undefined && (isNaN(price) || price < 0)) invalidBooths.push(`booths[${index}].price`);
        if (!b.id) invalidBooths.push(`booths[${index}].id`);
      });
    }

    /* =========================
       RETURN VALIDATION ERRORS
    ========================= */
    const allErrors = [...emptyFields, ...emptyVenueFields, ...invalidBooths];
    if (allErrors.length) {
      return res.status(400).json({
        error: "Validation failed",
        fields: allErrors
      });
    }

    /* =========================
       USER INFO
    ========================= */
    const userId = req.user._id;
    const creatorModel = req.user.role === "superadmin" ? "Superadmin" :
                         req.user.role === "admin" ? "Admin" : "Promoter";

    /* =========================
       BOOTH CALCULATIONS
    ========================= */
    const hasBooths = Array.isArray(booths) && booths.length > 0;
    const maxBooths = hasBooths ? booths.length : 0;

    /* =========================
       CREATE EVENT
    ========================= */
    const event = await Event.create({
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
      priceLevels: priceLevels.map(p => ({
        priceName: p.priceName,
        description: p.description || "",
        color: p.color || "#000000",
        facePrice: Number(p.facePrice),
        serviceCharge: Number(p.serviceCharge || 0),
        isFlexible: p.isFlexible || false,
        saleStart: p.saleStart || null,
        saleEnd: p.saleEnd || null,
        minPerOrder: p.minPerOrder || 1,
        maxPerOrder: p.maxPerOrder || 30,
        increment: p.increment || 1,
        quantityAvailable: Number(p.quantityAvailable || 0),
        quantitySold: Number(p.quantitySold || 0),
        isActive: p.isActive !== undefined ? p.isActive : true
      })),
      seatMap,
      booths: hasBooths ? booths.map(b => ({
        id: b.id,
        code: b.code || null,
        type: b.type || "standard",
        status: b.status || "available",
        x: b.x != null ? b.x : 0,
        y: b.y != null ? b.y : 0,
        width: b.width != null ? b.width : 50,
        height: b.height != null ? b.height : 50,
        price: Number(b.price)
      })) : [],
      hasBooths,
      maxBooths,
      isFeatured,
      createdBy: userId,
      creatorModel
    });

    return res.status(201).json({ event });

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
      booths = [],
      isFeatured
    } = req.body;

    /* =========================
       PARSE JSON (FormData safe)
    ========================= */
    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

    const image = req.file ? req.file.filename : req.body.image;

    /* =========================
       VALIDATION
    ========================= */
    let emptyFields = [];

    const requiredFields = [
      "title",
      "description",
      "category",
      "startDate",
      "endDate",
      "startTime",
      "endTime"
    ];

    requiredFields.forEach((field) => {
      if (!req.body[field] || String(req.body[field]).trim() === "") {
        emptyFields.push(field);
      }
    });

    if (!image) emptyFields.push("image");

    // Price levels required
    if (!Array.isArray(priceLevels) || priceLevels.length === 0) {
      emptyFields.push("priceLevels");
    }

    // Seating validation (seatMap optional based on your flow)
    if (eventType === "Seating Arrangement") {
      if (seatMap && typeof seatMap !== "object") {
        emptyFields.push("seatMap");
      }
    }

    /* =========================
       VENUE VALIDATION
    ========================= */
    const venueFields = ["name", "address", "city", "zipCode"];
    let emptyVenueFields = [];

    venueFields.forEach((field) => {
      if (!venue || !venue[field] || String(venue[field]).trim() === "") {
        emptyVenueFields.push(`venue.${field}`);
      }
    });

    /* =========================
       BOOTH VALIDATION
    ========================= */
    let invalidBooths = [];

    if (Array.isArray(booths)) {
      booths.forEach((b, index) => {
        if (!b.id) invalidBooths.push(`booths[${index}].id`);
        if (b.price === undefined || b.price < 0) {
          invalidBooths.push(`booths[${index}].price`);
        }
      });
    }

    /* =========================
       RETURN ERRORS
    ========================= */
    if (emptyFields.length || emptyVenueFields.length || invalidBooths.length) {
      return res.status(400).json({
        error: "Validation failed",
        emptyFields,
        emptyVenueFields,
        invalidBooths
      });
    }

    /* =========================
       BOOTH CALCULATIONS
    ========================= */
    const hasBooths = Array.isArray(booths) && booths.length > 0;

    const maxBooths = hasBooths ? booths.length : 0;

    /* =========================
       PREPARE UPDATE DATA
    ========================= */
    const updatedData = {
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      startTime,
      endTime,
      image,
      eventType,

      priceLevels: priceLevels.map((p) => ({
        priceName: p.priceName,
        description: p.description || "",
        color: p.color || "#000000",
        facePrice: Number(p.facePrice),
        serviceCharge: Number(p.serviceCharge || 0),
        isFlexible: p.isFlexible || false,
        saleStart: p.saleStart || null,
        saleEnd: p.saleEnd || null,
        minPerOrder: p.minPerOrder || 1,
        maxPerOrder: p.maxPerOrder || 30,
        increment: p.increment || 1,
        quantityAvailable: Number(p.quantityAvailable || 0),
        quantitySold: Number(p.quantitySold || 0),
      })),

      // allow updating seatMap (or keep existing if not provided)
      ...(seatMap !== undefined && { seatMap }),

      booths: hasBooths
        ? booths.map((b) => ({
            id: b.id,
            code: b.code || null,
            type: b.type || "standard",
            status: b.status || "available",
            x: b.x || 0,
            y: b.y || 0,
            width: b.width || 50,
            height: b.height || 50,
            price: Number(b.price),
          }))
        : [],

      hasBooths,
      maxBooths,

      isFeatured: isFeatured || false
    };

    /* =========================
       UPDATE EVENT
    ========================= */
    const event = await Event.findOneAndUpdate(
      { _id: id },
      updatedData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: "No such event" });
    }

    res.status(200).json({ event });

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
    const validPriceLevelIds = event.priceLevels.map((p) =>
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
              invalidSeats.push(`sections[${sIndex}].seats[${index}].priceLevelId INVALID`);
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