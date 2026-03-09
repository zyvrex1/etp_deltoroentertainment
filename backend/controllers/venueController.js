const mongoose = require("mongoose");
const Venue = require("../models/venueModel");
const Event = require("../models/eventModel");

// CREATE
const createVenue = async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json(venue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ
const getVenues = async (req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.status(200).json(venues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getVenue = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid venue ID" });
  }

  try {
    const venue = await Venue.findById(id);

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.status(200).json(venue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateVenue = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid venue ID" });
  }

  try {
    const venue = await Venue.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.status(200).json(venue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE (SAFE DELETE)
const deleteVenue = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid venue ID" });
  }

  try {
    // 🔥 Check if venue is used in any event
    const eventUsingVenue = await Event.findOne({ venue: id });

    if (eventUsingVenue) {
      return res.status(400).json({
        error: "Cannot delete venue. It is assigned to existing events."
      });
    }

    const venue = await Venue.findByIdAndDelete(id);

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.status(200).json({ message: "Venue deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createVenue,
  getVenues,
  getVenue,
  updateVenue,
  deleteVenue,
};