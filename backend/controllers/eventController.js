const Event = require('../models/eventModel')
const mongoose = require('mongoose')

// get all events
const getEvents = async (req, res) => {
    const events = await Event.find({}).sort({createdAt: -1})
    res.status(200).json(events)
}

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

    const requiredFields = [
        'title', 'description', 'category', 'venue', 
        'startDate', 'endDate', 'startTime', 'endTime', 
        'ticketPrice', 'totalTickets', 'image', 'booths'
    ];

    let emptyFields = [];

    requiredFields.forEach(field => {
        // Check for undefined, null, or empty string
        if (
            req.body[field] === undefined ||
            req.body[field] === null ||
            req.body[field] === ''
        ) {
            emptyFields.push(field);
        }
    });

    if (emptyFields.length > 0) {
        return res.status(400).json({ 
            error: 'Please fill in all the fields', 
            emptyFields 
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

        res.status(201).json(event); // 201 is better for create
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

// update a event
const updateEvent = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such event' });
  }

  try {
    const updatedData = { ...req.body };

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