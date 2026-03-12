const Event = require('../models/eventModel')
const Booth = require("../models/boothModel"); 
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

  const event = await Event.findById(id).populate({
    path: "createdBy",
    select: "firstName lastName role",
  });

  if (!event) {
    return res.status(404).json({ error: "No such event" });
  }

  res.status(200).json(event);
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
      ticketPrice,
      totalTickets,
      eventType,
      seatMap,
      seatVariations,
      booths = [],
      isFeatured
    } = req.body;

    // Parse JSON fields if coming from FormData
    if (typeof venue === "string") venue = JSON.parse(venue);
    if (typeof seatVariations === "string") seatVariations = JSON.parse(seatVariations);
    if (typeof booths === "string") booths = JSON.parse(booths);
    if (typeof seatMap === "string") seatMap = JSON.parse(seatMap);

    // Handle uploaded image
    const image = req.file ? req.file.filename : null;

    // Required fields
    const requiredFields = [
      "title",
      "description",
      "category",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "image"
    ];

    let emptyFields = [];

    requiredFields.forEach((field) => {
      if (field === "image") {
        if (!req.file) emptyFields.push("image");
      } else if (!req.body[field] || String(req.body[field]).trim() === "") {
        emptyFields.push(field);
      }
    });

    // Ticket validation
    if (eventType === "General Admission" && ticketPrice === undefined) {
      emptyFields.push("ticketPrice");
    }

    // Seating validation
    if (eventType === "Seating Arrangement") {
      if (!Array.isArray(seatVariations) || seatVariations.length === 0) {
        emptyFields.push("seatVariations");
      }

      if (seatMap && typeof seatMap !== "object") {
        emptyFields.push("seatMap");
      }
    }

    // Venue validation
    const venueFields = ["name", "address", "city", "zipCode"];
    let emptyVenueFields = [];

    venueFields.forEach((field) => {
      if (!venue || !venue[field] || String(venue[field]).trim() === "") {
        emptyVenueFields.push(`venue.${field}`);
      }
    });

    // Booth validation
    let invalidBooths = [];

    if (Array.isArray(booths)) {
      booths.forEach((b, index) => {
        if (b.size || b.price || b.quantity) {
          if (!b.size) invalidBooths.push(`booths[${index}].size`);
          if (b.price === undefined || b.price < 0)
            invalidBooths.push(`booths[${index}].price`);
          if (!b.quantity || b.quantity < 1)
            invalidBooths.push(`booths[${index}].quantity`);
        }
      });
    }

    // Return validation errors
    if (emptyFields.length || emptyVenueFields.length || invalidBooths.length) {
      return res.status(400).json({
        error: "Validation failed",
        emptyFields,
        emptyVenueFields,
        invalidBooths
      });
    }

    // User info
    const userId = req.user._id;

    let creatorModel =
      req.user.role === "superadmin"
        ? "Superadmin"
        : req.user.role === "admin"
        ? "Admin"
        : "Promoter";

    // Auto calculate total seats if seating arrangement
    let finalTotalTickets = totalTickets;

    if (
      eventType === "Seating Arrangement" &&
      (!totalTickets || totalTickets === 0)
    ) {
      finalTotalTickets = seatVariations ? seatVariations.length : 0;
    }

    // Booth calculations
    const hasBooths = Array.isArray(booths) && booths.length > 0;

    const maxBooths = hasBooths
      ? booths.reduce((sum, b) => sum + Number(b.quantity), 0)
      : 0;

    // Create event
    const event = await Event.create({
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      startTime,
      endTime,
      ticketPrice: Number(ticketPrice) || 0,
      totalTickets: finalTotalTickets,
      image,
      eventType,
      seatMap: seatMap || null,
      seatVariations: seatVariations || [],
      isFeatured: isFeatured || false,

      booths: hasBooths
        ? booths.map((b) => ({
            size: b.size,
            price: Number(b.price),
            quantity: Number(b.quantity)
          }))
        : [],

      hasBooths,
      maxBooths,

      createdBy: userId,
      creatorModel
    });

    res.status(201).json({ event });

  } catch (error) {

    console.error("Create Event Error:", error);

    res.status(500).json({
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
    return res.status(404).json({ error: 'No such event' });
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
      ticketPrice,
      totalTickets,
      eventType,
      seatMap,
      seatVariations,
      booths = [],
      isFeatured
    } = req.body;

    // ✅ Parse JSON strings from FormData
    if (typeof seatVariations === "string") {
      try { seatVariations = JSON.parse(seatVariations); } 
      catch { seatVariations = []; }
    }
    if (typeof booths === "string") {
      try { booths = JSON.parse(booths); } 
      catch { booths = []; }
    }

    // Use uploaded image if exists
    const image = req.file ? req.file.filename : req.body.image;

    // Validation
    let emptyFields = [];
    const requiredFields = ["title", "description", "category", "startDate", "endDate", "startTime", "endTime", "image"];
    requiredFields.forEach(field => {
      if (!req.body[field] && field !== "image") emptyFields.push(field);
    });
    if (!image) emptyFields.push("image");

    // ticketPrice required only for General Admission
    if (eventType === "General Admission" && (ticketPrice === null || ticketPrice === undefined)) {
      emptyFields.push("ticketPrice");
    }

    if (eventType === "Seating Arrangement") {
  // Seat map is optional (for future floor plan builder)
  if (!Array.isArray(seatVariations) || seatVariations.length === 0) {
    emptyFields.push("seatVariations");
  }
}

    // Venue validation
    const venueFields = ["name", "address", "city", "zipCode"];
    let emptyVenueFields = [];
    venueFields.forEach(field => {
      if (!venue || !venue[field] || String(venue[field]).trim() === "") {
        emptyVenueFields.push(`venue.${field}`);
      }
    });

    // Booth validation
    let invalidBooths = [];
    if (Array.isArray(booths)) {
  booths.forEach((b, index) => {
    if (b.size || b.price || b.quantity) {
      if (!b.size) invalidBooths.push(`booths[${index}].size`);
      if (b.price === undefined || b.price < 0) invalidBooths.push(`booths[${index}].price`);
      if (!b.quantity || b.quantity < 1) invalidBooths.push(`booths[${index}].quantity`);
    }
  });
}

    // Return validation errors
    if (emptyFields.length || emptyVenueFields.length || invalidBooths.length) {
      return res.status(400).json({
        error: "Validation failed",
        emptyFields,
        emptyVenueFields,
        invalidBooths
      });
    }

    // Prepare final updated data
    const updatedData = {
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      startTime,
      endTime,
      ticketPrice: Number(ticketPrice) || 0,
      image,
      eventType,
      seatMap: seatMap || null,
      seatVariations: seatVariations || [],
      isFeatured: isFeatured || false,
      booths: Array.isArray(booths)
        ? booths.map(b => ({
            size: b.size,
            price: Number(b.price),
            quantity: Number(b.quantity)
          }))
        : [],
      hasBooths: Array.isArray(booths) && booths.length > 0,
      maxBooths: Array.isArray(booths) && booths.length > 0
        ? booths.reduce((sum, b) => sum + Number(b.quantity), 0)
        : 0
    };

    // Calculate totalTickets for Seating Arrangement if not provided
    if (eventType === "Seating Arrangement" && (!totalTickets || totalTickets === 0)) {
      updatedData.totalTickets = seatVariations
        ? seatVariations.reduce((sum, v) => sum + (v.quantity || 1), 0)
        : 0;
    } else {
      updatedData.totalTickets = totalTickets;
    }

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
    res.status(500).json({ error: "Server error while updating event", message: error.message });
  }
};

module.exports = {
    getEvents,
    getEvent,
    createEvent,
    deleteEvent,
    updateEvent,
    upload,
}