const Event = require('../models/eventModel')
const Booth = require("../models/boothModel"); 
const mongoose = require('mongoose')

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

// create new event
const createEvent = async (req, res) => {
  const {
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
    image,
    eventType,
    seatMap,
    seatVariations,
    booths = [], // default to empty array
    isFeatured
  } = req.body;

  // -----------------------------
  // Required fields validation
  // -----------------------------
  const requiredFields = ['title','description','category','startDate','endDate','startTime','endTime','image'];
  let emptyFields = [];

  requiredFields.forEach(field => {
    if (!req.body[field] || req.body[field].toString().trim() === '') {
      emptyFields.push(field);
    }
  });

  // ticketPrice required only for General Admission
  if (eventType === "General Admission" && (ticketPrice === null || ticketPrice === undefined)) {
    emptyFields.push("ticketPrice");
  }

  // Seating Arrangement: seatMap & seatVariations required
  if (eventType === "Seating Arrangement") {
    if (!seatMap || Object.keys(seatMap).length === 0) {
      emptyFields.push("seatMap");
    }
    if (!seatVariations || seatVariations.length === 0) {
      emptyFields.push("seatVariations");
    }
  }

  // -----------------------------
  // Venue validation
  // -----------------------------
  const venueFields = ['name','address','city','zipCode'];
  let emptyVenueFields = [];
  venueFields.forEach(field => {
    if (!venue || !venue[field] || venue[field].trim() === '') {
      emptyVenueFields.push(`venue.${field}`);
    }
  });

  // -----------------------------
  // Booths validation
  // -----------------------------
  let invalidBooths = [];
  if (Array.isArray(booths)) {
    booths.forEach((booth, index) => {
      if (!booth.boothNumber || booth.boothNumber.trim() === '') {
        invalidBooths.push(`booths[${index}].boothNumber`);
      }
      if (booth.price === undefined || booth.price < 0) {
        invalidBooths.push(`booths[${index}].price`);
      }
    });
  }

  // Return errors if any
  if (emptyFields.length > 0 || emptyVenueFields.length > 0 || invalidBooths.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      emptyFields,
      emptyVenueFields,
      invalidBooths
    });
  }

  try {
    // -----------------------------
    // Determine who created the event
    // -----------------------------
    const userId = req.user._id;
    const creatorModel = req.user.role === 'admin' ? 'Admin' : 'Promoter';

    // Auto-calculate totalTickets for seating arrangement
    let finalTotalTickets = totalTickets;
    if (eventType === "Seating Arrangement" && (!totalTickets || totalTickets === 0)) {
      finalTotalTickets = seatVariations ? seatVariations.length : 0;
    }

    // -----------------------------
    // Create Event document
    // -----------------------------
    const event = await Event.create({
      title,
      description,
      category,
      venue,
      startDate,
      endDate,
      startTime,
      endTime,
      ticketPrice: ticketPrice || 0,
      totalTickets: finalTotalTickets,
      image,
      eventType,
      seatMap: seatMap || null,
      seatVariations: seatVariations || [],
      isFeatured,
      createdBy: userId,
      creatorModel
    });

    // -----------------------------
    // Create booths if any
    // -----------------------------
    if (Array.isArray(booths) && booths.length > 0) {
      const boothDocs = booths.map(b => ({
        eventId: event._id,
        boothNumber: b.boothNumber,
        size: b.size || null,
        price: b.price,
        sponsorId: b.sponsorId || null
      }));

      await Booth.insertMany(boothDocs);
    }

    res.status(201).json({ event, boothsCreated: booths.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
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
    // Filter out undefined fields
    const updatedData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) updatedData[key] = req.body[key];
    });

    // If venue is included, validate nested fields
    if (updatedData.venue) {
      const venueFields = ['name', 'address', 'city', 'zipCode'];
      let emptyVenueFields = [];
      venueFields.forEach(field => {
        if (!updatedData.venue[field] || updatedData.venue[field].trim() === '') {
          emptyVenueFields.push(`venue.${field}`);
        }
      });

      if (emptyVenueFields.length > 0) {
        return res.status(400).json({ error: 'Venue fields missing', emptyVenueFields });
      }
    }

    // If booths are included, validate each booth
    if (updatedData.booths) {
      let invalidBooths = [];
      if (!Array.isArray(updatedData.booths) || updatedData.booths.length === 0) {
        return res.status(400).json({ error: 'Booths must be a non-empty array' });
      }

      updatedData.booths.forEach((booth, index) => {
        if (!booth.boothNumber || booth.boothNumber.trim() === '') {
          invalidBooths.push(`booths[${index}].boothNumber`);
        }
        if (booth.price === undefined || booth.price < 0) {
          invalidBooths.push(`booths[${index}].price`);
        }
      });

      if (invalidBooths.length > 0) {
        return res.status(400).json({ error: 'Invalid booths', invalidBooths });
      }
    }

    const event = await Event.findOneAndUpdate(
      { _id: id },
      updatedData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ error: 'No such event' });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
    getEvents,
    getEvent,
    createEvent,
    deleteEvent,
    updateEvent
}