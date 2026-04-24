const mongoose = require("mongoose");
const Merchandise = require("../models/merchandiseModel");
const Sponsor = require("../models/sponsorModel");

// CREATE
const createMerchandise = async (req, res) => {
  const { name, description, price, category, stock, image, eventId, status } = req.body;
  const userId = req.user._id;

  if (!name || !price || !category || !eventId) {
    return res.status(400).json({ error: "Missing required fields: name, price, category, and eventId are required." });
  }

  try {
    // 🔥 Find the sponsor profile for this user
    const sponsor = await Sponsor.findOne({ userId });
    if (!sponsor) {
      return res.status(403).json({ error: "Sponsor profile not found. Only users with a sponsor profile can create merchandise." });
    }

    const merchandise = await Merchandise.create({
      name,
      description,
      price,
      category,
      stock,
      image,
      eventId,
      status,
      sponsorId: sponsor._id, // 🔥 Linking to Sponsor profile
      createdBy: userId,
    });
    res.status(201).json(merchandise);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ (GET ALL with filters)
const getMerchandises = async (req, res) => {
  const { eventId, category, status, sponsorId } = req.query;
  const filter = {};

  if (eventId) filter.eventId = eventId;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (sponsorId) filter.sponsorId = sponsorId;

  try {
    const merchandises = await Merchandise.find(filter)
      .populate("eventId", "title")
      .populate("sponsorId", "companyName industry")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });
    res.status(200).json(merchandises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ (GET ONE)
const getMerchandise = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid merchandise ID" });
  }

  try {
    const merchandise = await Merchandise.findById(id)
      .populate("eventId", "title")
      .populate("sponsorId", "companyName industry phone")
      .populate("createdBy", "firstName lastName");

    if (!merchandise) {
      return res.status(404).json({ error: "Merchandise not found" });
    }

    res.status(200).json(merchandise);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateMerchandise = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid merchandise ID" });
  }

  try {
    const existingMerch = await Merchandise.findById(id);
    if (!existingMerch) {
      return res.status(404).json({ error: "Merchandise not found" });
    }

    // 🔥 Check Ownership: Allow own creation or Admin/Superadmin
    const userRole = req.user.role.toLowerCase();
    if (existingMerch.createdBy.toString() !== req.user._id.toString() && 
        userRole !== "admin" && userRole !== "superadmin") {
      return res.status(403).json({ error: "Access denied. You don't have permission to update this merchandise." });
    }

    const merchandise = await Merchandise.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate("eventId", "title")
     .populate("sponsorId", "companyName industry");

    res.status(200).json(merchandise);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE
const deleteMerchandise = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid merchandise ID" });
  }

  try {
    const existingMerch = await Merchandise.findById(id);
    if (!existingMerch) {
      return res.status(404).json({ error: "Merchandise not found" });
    }

    // 🔥 Check Ownership: Allow own creation or Admin/Superadmin
    const userRole = req.user.role.toLowerCase();
    if (existingMerch.createdBy.toString() !== req.user._id.toString() && 
        userRole !== "admin" && userRole !== "superadmin") {
      return res.status(403).json({ error: "Access denied. You don't have permission to delete this merchandise." });
    }

    await Merchandise.findByIdAndDelete(id);

    res.status(200).json({ message: "Merchandise deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createMerchandise,
  getMerchandises,
  getMerchandise,
  updateMerchandise,
  deleteMerchandise,
};
