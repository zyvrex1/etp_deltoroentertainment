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

    // Parse JSON if it's sent as a string
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

    // Safety check for event.priceLevels
    if (!event.priceLevels) event.priceLevels = [];

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
        isActive: p.isActive !== false,
        ticketDesign: p.ticketDesign || null
      };
    }).filter(Boolean);

    if (mappedPriceLevels.length === 0) {
      return res.status(400).json({ error: "No valid price levels generated" });
    }

    // Update existing or add new
    const incomingIds = mappedPriceLevels.map(p => p._id.toString());
    
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
      message: err.message
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

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Handle ticketDesign specifically if present
    if (updateData.ticketDesign) {
      if (!event.ticketLayouts) event.ticketLayouts = [];

      const layoutIndex = event.ticketLayouts.findIndex(l =>
        (l.priceLevelId?._id || l.priceLevelId)?.toString() === priceLevelId
      );

      if (layoutIndex > -1) {
        event.ticketLayouts[layoutIndex].layout = updateData.ticketDesign;
        if (updateData.themeColor) event.ticketLayouts[layoutIndex].themeColor = updateData.themeColor;
      } else {
        event.ticketLayouts.push({
          priceLevelId: new mongoose.Types.ObjectId(priceLevelId),
          layout: updateData.ticketDesign,
          themeColor: updateData.themeColor || "#D32F2F"
        });
      }
      delete updateData.ticketDesign;
      delete updateData.themeColor;
      event.markModified('ticketLayouts');
    }

    // Update other price level fields if any
    if (Object.keys(updateData).length > 0) {
      const plIndex = event.priceLevels.findIndex(pl => pl._id.toString() === priceLevelId);
      if (plIndex > -1) {
        for (const key in updateData) {
          event.priceLevels[plIndex][key] = updateData[key];
        }
        event.markModified('priceLevels');
      }
    }

    console.log("Attempting to save event...");
    await event.save();
    res.status(200).json({ message: "Price level and layout updated", event });
  } catch (err) {
    console.error("Update PriceLevel Error:", err);
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

    await event.save();

    res.status(200).json({ message: "Price level removed", event });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", message: err.message });
  }
};

module.exports = { addPriceLevels, getPriceLevels, updatePriceLevel, deletePriceLevel };
