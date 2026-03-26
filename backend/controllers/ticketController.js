const mongoose = require("mongoose");
const Event = require("../models/eventModel");

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

    // Map incoming price levels with type safety
    const mappedPriceLevels = priceLevels.map(p => ({
      _id: p._id ? mongoose.Types.ObjectId(p._id) : new mongoose.Types.ObjectId(),
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
    console.error(err);
    return res.status(500).json({ error: "Server error", message: err.message });
  }
};

module.exports = { addPriceLevels }