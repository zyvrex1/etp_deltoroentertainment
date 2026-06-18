const mongoose = require("mongoose");
const Merchandise = require("../models/merchandiseModel");
const Sponsor = require("../models/sponsorModel");
const { optimizeImageBuffer } = require("../utils/imageOptimizer");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/s3Client");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const isR2Configured = () =>
  !!process.env.R2_BUCKET_NAME &&
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY;

/**
 * Upload a base64 image to R2, or save it locally to /uploads/ as a fallback.
 * Returns the stored image path/URL, or null on failure.
 */
const uploadMerchImage = async (base64String) => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const { buffer: optimized, contentType, ext } = await optimizeImageBuffer(buffer, mimeType);

  if (!isR2Configured()) {
    // ── Local fallback (dev): save to backend/uploads/ ──
    const filename = `${uuidv4()}${ext}`;
    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, filename), optimized);
    console.log(`✅ Saved merch image locally: ${filename}`);
    return `/uploads/${filename}`;
  }

  // ── R2 upload ──
  const key = `merchandise/${uuidv4()}${ext}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: optimized,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${process.env.CDN_BASE_URL}/${key}`;
};

/**
 * Delete a stored image (local or R2) using its URL.
 */
const deleteStoredImage = async (imageUrl) => {
  if (!imageUrl) return;
  try {
    if (!isR2Configured()) {
      // Local file deletion
      const filename = path.basename(imageUrl);
      const localPath = path.join(__dirname, "..", "uploads", filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`🗑️ Deleted local merch image: ${filename}`);
      }
    } else {
      // R2 deletion
      const key = imageUrl.split('/').slice(-2).join('/'); // extracts merchandise/uuid.webp
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
        })
      );
      console.log(`🗑️ Deleted R2 merch image: ${key}`);
    }
  } catch (error) {
    console.error('Failed to delete old merch image:', error);
  }
};

// CREATE
const createMerchandise = async (req, res) => {
  const { name, description, price, category, stock, image, eventId, boothCode, status } = req.body;
  const userId = req.user._id;

  if (!name || price === undefined || price === null || !category || !eventId) {
    return res.status(400).json({ error: "Missing required fields: name, price, category, and eventId are required." });
  }

  try {
    // 🔥 Find the sponsor profile for this user
    const sponsor = await Sponsor.findOne({ userId });
    if (!sponsor) {
      return res.status(403).json({ error: "Sponsor profile not found. Only users with a sponsor profile can create merchandise." });
    }

    let finalImage = image;
    if (image && image.startsWith('data:image')) {
      finalImage = await uploadMerchImage(image);
    }
    const merchandise = await Merchandise.create({
      name,
      description,
      price,
      category,
      stock,
      image: finalImage,
      eventId,
      boothCode,
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
  const { eventId, boothCode, category, status, sponsorId } = req.query;
  const filter = {};

  if (eventId) filter.eventId = eventId;
  if (boothCode) filter.boothCode = boothCode;
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

    let finalData = { ...req.body };

    // 🔥 Delete old image if it was replaced or removed
    if (req.body.image !== undefined && req.body.image !== existingMerch.image) {
      if (existingMerch.image) {
        await deleteStoredImage(existingMerch.image);
      }
    }

    if (req.body.image && req.body.image.startsWith('data:image')) {
      finalData.image = await uploadMerchImage(req.body.image);
    }

    const merchandise = await Merchandise.findByIdAndUpdate(
      id,
      finalData,
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

    // 🔥 Delete the image from storage when product is deleted
    if (existingMerch.image) {
      await deleteStoredImage(existingMerch.image);
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
