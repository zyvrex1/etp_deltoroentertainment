const mongoose = require("mongoose");
const Event = require("../models/eventModel");

const toObjectId = (id) => {
  try {
    return id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId();
  } catch {
    return new mongoose.Types.ObjectId();
  }
};

const addPriceLevels = async (req, res) => {
  try {
    const { eventId } = req.params;
    let { priceLevels } = req.body;

    if (!priceLevels || !priceLevels.length) {
      return res.status(400).json({ error: "No priceLevels provided" });
    }

    // Parse JSON if needed
    if (typeof priceLevels === "string") priceLevels = JSON.parse(priceLevels);

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Map incoming price levels with safe ObjectId
    const mappedPriceLevels = priceLevels.map(p => ({
      _id: toObjectId(p._id),
      priceName: p.priceName,
      description: p.description,
      color: p.color,
      facePrice: Number(p.facePrice),
      serviceCharge: Number(p.serviceCharge || 0),
      minPerOrder: Number(p.minPerOrder || 1),
      maxPerOrder: Number(p.maxPerOrder || 30),
      increment: Number(p.increment || 1),
      quantityAvailable: Number(p.quantityAvailable || 0),
      quantitySold: Number(p.quantitySold || 0),
      isActive: p.isActive !== false
    }));

    // Remove existing price levels that have the same _id as incoming
    const incomingIds = mappedPriceLevels.map(p => p._id.toString());
    event.priceLevels = event.priceLevels.filter(
      existing => !incomingIds.includes(existing._id.toString())
    );

    // Append the new price levels
    event.priceLevels.push(...mappedPriceLevels);

    await event.save();

    return res.status(200).json({ event });
  } catch (err) {
    console.error("Add PriceLevels Error:", err);
    return res.status(500).json({ error: "Server error", message: err.message });
  }
};

const getPriceLevels = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).select("priceLevels");

    if (!event) return res.status(404).json({ error: "Event not found" });

    res.status(200).json(event.priceLevels);
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
};

const updatePriceLevel = async (req, res) => {
  try {
    const { eventId, priceLevelId } = req.params;
    const updateData = req.body;

    // Remove _id from body to prevent Mongoose errors during $set
    delete updateData._id;

    const event = await Event.findOneAndUpdate(
      { _id: eventId, "priceLevels._id": priceLevelId },
      {
        $set: {
          "priceLevels.$": { ...updateData, _id: priceLevelId }
        }
      },
      { new: true, runValidators: true }
    );

    if (!event) return res.status(404).json({ error: "Event or Price Level not found" });

    res.status(200).json({ message: "Price level updated", event });
  } catch (err) {
    res.status(500).json({ error: "Update failed", message: err.message });
  }
};

const deletePriceLevel = async (req, res) => {
  try {
    const { eventId, priceLevelId } = req.params;

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $pull: { priceLevels: { _id: priceLevelId } } },
      { new: true }
    );

    if (!event) return res.status(404).json({ error: "Event not found" });

    res.status(200).json({ message: "Price level removed", event });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

module.exports = { addPriceLevels, getPriceLevels, updatePriceLevel, deletePriceLevel };