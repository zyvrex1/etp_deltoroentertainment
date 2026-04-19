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

    if (!priceLevels) {
      return res.status(400).json({ error: "No priceLevels provided in request body" });
    }

    // Parse JSON if it's sent as a string (common with multipart/form-data but also good safe check)
    if (typeof priceLevels === "string") {
      try {
        priceLevels = JSON.parse(priceLevels);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON format for priceLevels" });
      }
    }

    if (!Array.isArray(priceLevels)) {
      priceLevels = [priceLevels]; // Convert single object to array if needed
    }

    if (priceLevels.length === 0) {
      return res.status(400).json({ error: "priceLevels array is empty" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Map incoming price levels with safe checks
    const mappedPriceLevels = priceLevels.map(p => {
      if (!p) return null;
      return {
        _id: p._id && mongoose.Types.ObjectId.isValid(p._id) ? new mongoose.Types.ObjectId(p._id) : new mongoose.Types.ObjectId(),
        priceName: p.priceName || p.name || "Unnamed Category",
        description: p.description || "",
        color: p.color || "#666666",
        facePrice: Number(p.facePrice || p.price || 0),
        serviceCharge: Number(p.serviceCharge || 0),
        type: p.type || "Seat (Circle)",
        boothSize: p.boothSize || "",
        minPerOrder: Number(p.minPerOrder || 1),
        maxPerOrder: Number(p.maxPerOrder || 30),
        increment: Number(p.increment || 1),
        quantityAvailable: Number(p.quantityAvailable || p.quantity || 0),
        quantitySold: Number(p.quantitySold || 0),
        isActive: p.isActive !== false
      };
    }).filter(Boolean);

    if (mappedPriceLevels.length === 0) {
      return res.status(400).json({ error: "No valid price levels generated" });
    }

    // Update existing or add new
    const incomingIds = mappedPriceLevels.map(p => p._id.toString());
    
    // Safety check for event.priceLevels
    if (!event.priceLevels) event.priceLevels = [];

    // Filter out existing price levels that are being replaced
    event.priceLevels = event.priceLevels.filter(
      existing => existing && existing._id && !incomingIds.includes(existing._id.toString())
    );

    // Append the new price levels
    event.priceLevels.push(...mappedPriceLevels);

    // Use markModified if needed for Mixed types or nested arrays
    event.markModified('priceLevels');

    await event.save();

    return res.status(200).json({ event });
  } catch (err) {
    console.error("Add PriceLevels Error:", err);
    return res.status(500).json({ 
      error: "Server encountered an error while adding price levels", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
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

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Remove the price level
    event.priceLevels = event.priceLevels.filter(p => p._id.toString() !== priceLevelId);

    // Save will trigger the pre-save hook in eventModel.js, 
    // which now also cleans up layoutData.items
    await event.save();

    res.status(200).json({ message: "Price level removed", event });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

module.exports = { addPriceLevels, getPriceLevels, updatePriceLevel, deletePriceLevel };