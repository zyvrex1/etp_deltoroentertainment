const Event = require('../models/eventModel')
const mongoose = require('mongoose')

// get all events
const getEvents = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role?.toLowerCase();

    console.log("Decoded user:", user);

    let events;

    if (role === 'superadmin' || role === 'admin') {
      events = await Event.find({}).sort({ createdAt: -1 });
    } 
    else if (role === 'promoter') {
      events = await Event.find({ user_id: user._id }).sort({ createdAt: -1 });
    } 
    else if (role === 'customer' || role === 'sponsor') {
      events = await Event.find({ status: 'approved' }).sort({ createdAt: -1 });
    } 
    else {
      return res.status(403).json({ error: 'Unauthorized role' });
    }

    return res.status(200).json(events);

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// get a single event
const getEvent = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: 'No such event'})
    }

    const event = await Event.findById(id)

    if (!event) {
        return res.status(404).json({error: 'No such event'})
    }

    res.status(200).json(event)
}

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
    booths,
    isFeatured
  } = req.body;

  // Check required simple fields
  const requiredFields = ['title', 'description', 'category', 'startDate', 'endDate', 'startTime', 'endTime', 'ticketPrice', 'totalTickets', 'image'];
  let emptyFields = [];

  requiredFields.forEach(field => {
    if (!req.body[field] || req.body[field].toString().trim() === '') {
      emptyFields.push(field);
    }
  });

  // Validate venue object
  const venueFields = ['name', 'address', 'city', 'zipCode'];
  let emptyVenueFields = [];
  venueFields.forEach(field => {
    if (!venue || !venue[field] || venue[field].trim() === '') {
      emptyVenueFields.push(`venue.${field}`);
    }
  });

  // Validate booths array
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

  // No booths at all is fine
  if (invalidBooths.length > 0) {
    return res.status(400).json({ error: 'Invalid booths', invalidBooths });
  }

  booths.forEach((booth, index) => {
    if (!booth.boothNumber || booth.boothNumber.trim() === '') {
      invalidBooths.push(`booths[${index}].boothNumber`);
    }
    if (booth.price === undefined || booth.price < 0) {
      invalidBooths.push(`booths[${index}].price`);
    }
  });

  if (emptyFields.length > 0 || emptyVenueFields.length > 0 || invalidBooths.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      emptyFields,
      emptyVenueFields,
      invalidBooths
    });
  }

  try {
    const user_id = req.user._id;

    const event = await Event.create({
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
      booths,
      isFeatured,
      user_id
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
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