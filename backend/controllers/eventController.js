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
    let eventsQuery;

    if (user) {
      const role = user.role?.toLowerCase();
      console.log("Decoded user role:", role);

      if (role === "superadmin" || role === "admin") {
        eventsQuery = Event.find({}).sort({ createdAt: -1 });
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
      eventType = "General Admission",
      ticketPrice,
      totalTickets,
      seatVariations,
      priceLevels,
      seatMap = {},
      booths = [],
      isFeatured = false
    } = req.body;

    /* =========================
       PARSE JSON (FormData safe)
    ========================= */
    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof seatVariations === "string") seatVariations = JSON.parse(seatVariations);
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

    /* =========================
       MAP FRONTEND FIELDS TO PRICELEVELS
    ========================= */
    if (!priceLevels || priceLevels.length === 0) {
      if (eventType === "General Admission") {
        priceLevels = [{
          priceName: "Standard",
          facePrice: Number(ticketPrice) || 0,
          quantityAvailable: Number(totalTickets) || 0,
          isActive: true
        }];
      } else if (eventType === "Seating Arrangement" && seatVariations) {
        priceLevels = seatVariations.map(sv => ({
          priceName: `Seat ${sv.seatNumber}`,
          facePrice: Number(sv.price) || 0,
          quantityAvailable: 1,
          isActive: true
        }));
      } else {
        priceLevels = [];
      }
    }

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
      // NOTE: SeatMap might be optional during initial creation in some flows
      // emptyFields.push("seatMap"); 
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
       BOOTH VALIDATION & ID MAPPING
    ========================= */
    let invalidBooths = [];
    if (Array.isArray(booths)) {
      booths = booths.map((b, index) => {
        const price = Number(b.price);
        if (b.price !== undefined && (isNaN(price) || price < 0)) invalidBooths.push(`booths[${index}].price`);
        
        // Auto-generate ID if missing
        if (!b.id) {
          b.id = `booth-${Date.now()}-${index}`;
        }
        return b;
      });
    }

    /* =========================
       RETURN VALIDATION ERRORS
    ========================= */
    const allErrors = [...emptyFields, ...emptyVenueFields, ...invalidBooths];
    if (allErrors.length) {
      console.log("Validation failed:", allErrors);
      return res.status(400).json({
        error: "Validation failed",
        fields: allErrors
      });
    }

    /* =========================
       USER INFO
    ========================= */
    const userId = req.user._id;
    const roleLower = (req.user.role || "").toLowerCase();
    const creatorModel = roleLower === "superadmin" ? "Superadmin" :
                         roleLower === "admin" ? "Admin" : "Promoter";

    // Auto-approve if created by admin or superadmin
    const status = (roleLower === "admin" || roleLower === "superadmin") ? "approved" : "pending";

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
      seatMap: (seatMap && Object.keys(seatMap).length > 0) ? seatMap : null,
      booths: hasBooths ? booths.map(b => ({
        id: b.id,
        code: b.code || null,
        type: b.type || "standard",
        status: b.status || "available",
        x: b.x != null ? Number(b.x) : 0,
        y: b.y != null ? Number(b.y) : 0,
        width: b.width != null ? Number(b.width) : 50,
        height: b.height != null ? Number(b.height) : 50,
        price: Number(b.price)
      })) : [],
      hasBooths,
      maxBooths,
      isFeatured: isFeatured === "true" || isFeatured === true,
      createdBy: userId,
      creatorModel,
      status // Use the derived status
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
      // For PATCH, only validate if the field is actually sent in the request
      if (req.body.hasOwnProperty(field) && (String(req.body[field]).trim() === "")) {
        emptyFields.push(field);
      }
    });

    // If it's a status-only update, we don't need image/priceLevels/venue validation
    const hasDetails = requiredFields.some(f => req.body.hasOwnProperty(f));
    
    if (hasDetails && !image && req.body.hasOwnProperty('image')) emptyFields.push("image");

    if (hasDetails && req.body.hasOwnProperty('priceLevels') && (!Array.isArray(priceLevels) || priceLevels.length === 0)) {
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

    if (req.body.hasOwnProperty('venue')) {
      venueFields.forEach((field) => {
        if (!venue || !venue[field] || String(venue[field]).trim() === "") {
          emptyVenueFields.push(`venue.${field}`);
        }
      });
    }

    /* =========================
       BOOTH VALIDATION
    ========================= */
    let invalidBooths = [];

    if (req.body.hasOwnProperty('booths') && Array.isArray(booths)) {
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
       PREPARE UPDATE DATA (DYNAMIC)
    ========================= */
    const updatedData = {};

    // Map each possible field from req.body if it exists
    const directFields = ["title", "description", "category", "startDate", "endDate", "startTime", "endTime", "eventType", "isFeatured", "status", "rejectionReason"];
    directFields.forEach(f => {
      if (req.body.hasOwnProperty(f)) {
        updatedData[f] = req.body[f];
      }
    });

    if (image !== undefined) updatedData.image = image;
    if (venue !== undefined) updatedData.venue = venue;
    if (seatMap !== undefined) updatedData.seatMap = seatMap;
    if (req.body.hasOwnProperty('booths')) {
        updatedData.booths = booths.map(b => ({
            id: b.id,
            code: b.code || null,
            type: b.type || "standard",
            status: b.status || "available",
            x: b.x || 0,
            y: b.y || 0,
            width: b.width || 50,
            height: b.height || 50,
            price: Number(b.price)
        }));
        updatedData.hasBooths = hasBooths;
        updatedData.maxBooths = maxBooths;
    }

    if (req.body.hasOwnProperty('priceLevels')) {
        updatedData.priceLevels = priceLevels.map((p) => ({
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
        }));
    }

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