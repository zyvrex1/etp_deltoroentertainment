const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');
const { optimizeImage } = require('../utils/imageOptimizer');

// Configure multer for floorplan uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const cleanName = originalName.replace(/\s+/g, "-").toLowerCase();

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    const timestamp = `${mm}${dd}${yy}${hh}${min}`;

    cb(null, `floorplan-${cleanName}-${timestamp}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPG, PNG, WEBP)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes
  },
});

// Require authentication for all upload routes
router.use(requireAuth);

router.post('/floorplan', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    // Optional: optimize the uploaded image
    const filePath = path.join(__dirname, "..", "uploads", req.file.filename);
    try {
      await optimizeImage(filePath);
    } catch (optErr) {
      console.warn("Failed to optimize image, but continuing:", optErr);
    }

    // Return the URL path to the uploaded image
    // Note: Assuming '/uploads/filename.ext' maps to the express.static path
    const fileUrl = `/uploads/${req.file.filename}`;
    
    return res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error("Floorplan upload error:", error);
    return res.status(500).json({ error: "Failed to process floor plan image." });
  }
});

module.exports = router;
