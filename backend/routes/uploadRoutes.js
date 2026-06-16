const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const requireAuth = require('../middleware/requireAuth');
const { optimizeImage, optimizeImageBuffer } = require('../utils/imageOptimizer');
const { s3Client } = require('../config/s3Client');

// ─── Auth guard on all routes ─────────────────────────────────
router.use(requireAuth);

// ─── Shared file filter ───────────────────────────────────────
const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const validExt = allowed.test(path.extname(file.originalname).toLowerCase());
  const validMime = allowed.test(file.mimetype);
  if (validExt && validMime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPG, PNG, WEBP)'));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/floorplan
//
// Kept on local disk because floorplans are used inside the seat-map builder
// (canvas rendering) and don't need CDN delivery.  Still optimized in-place
// by sharp before the URL is returned.
// ─────────────────────────────────────────────────────────────────────────────
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const cleanName = originalName.replace(/\s+/g, '-').toLowerCase();
    const now = new Date();
    const timestamp = [
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getFullYear()).slice(-2),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
    ].join('');
    cb(null, `floorplan-${cleanName}-${timestamp}${path.extname(file.originalname)}`);
  },
});

const diskUpload = multer({
  storage: diskStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/floorplan', memoryUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    const { buffer, contentType, ext } = await optimizeImageBuffer(
      req.file.buffer,
      req.file.mimetype
    );

    const key = `floorplans/${uuidv4()}${ext}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    const cdnUrl = `${process.env.CDN_BASE_URL}/${key}`;
    console.log(`✅ Uploaded floorplan to R2: ${key}`);

    return res.status(200).json({ url: cdnUrl, key });
  } catch (error) {
    console.error('Floorplan upload error:', error);
    return res.status(500).json({ error: 'Failed to upload floor plan image.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/image
//
// General-purpose image upload for events, products, profiles, etc.
//
// Steps:
//   1. multer receives the file into memory (no disk write — Step 11)
//   2. sharp converts the buffer to optimised .webp (Step 12)
//   3. The webp buffer is PUT directly to Cloudflare R2
//   4. The public CDN URL is returned — this is what gets stored in MongoDB
//
// Why not a presigned PUT from the client?
//   Presigned PUTs send the raw, unoptimised file.  Doing the upload
//   server-side lets us run Step 12 optimization before the bytes
//   ever reach the bucket, keeping the entire flow transparent to the
//   frontend with zero extra round-trips.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/image', memoryUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    // Step 12: optimize in memory, always output .webp
    const { buffer, contentType, ext } = await optimizeImageBuffer(
      req.file.buffer,
      req.file.mimetype
    );

    // Step 11: PUT directly to R2 — server pushes the buffer, not the client
    const key = `uploads/${uuidv4()}${ext}`; // e.g. uploads/abc-123.webp

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // CacheControl tells the CDN to cache images for 1 year — they're
        // content-addressed by UUID so stale-cache is never an issue.
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );

    const cdnUrl = `${process.env.CDN_BASE_URL}/${key}`;
    console.log(`✅ Uploaded optimized image to R2: ${key}`);

    return res.status(200).json({ url: cdnUrl, key });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/uploads/image
//
// Removes an image from R2 when the user deletes or replaces it.
// Body: { key: "uploads/uuid.webp" }
//
// Callers should pass the `key` returned from POST /api/uploads/image,
// not the full CDN URL.  The key validation prevents deleting arbitrary
// bucket objects outside the uploads/ prefix.
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/image', async (req, res) => {
  try {
    const { key } = req.body;

    if (!key || typeof key !== 'string' || !key.startsWith('uploads/')) {
      return res.status(400).json({ error: 'Invalid or missing image key.' });
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );

    console.log(`🗑️  Deleted R2 object: ${key}`);
    return res.status(200).json({ message: 'Image deleted successfully.' });
  } catch (error) {
    console.error('Image delete error:', error);
    return res.status(500).json({ error: 'Failed to delete image.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/uploads/presign  (kept for backward-compat / future use)
//
// Returns a signed PUT URL if you ever need the client to upload directly
// to R2 without hitting your server (e.g. very large files).
// NOTE: presigned PUTs bypass server-side optimization — prefer /image above.
// ─────────────────────────────────────────────────────────────────────────────
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const ALLOWED_PRESIGN_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

router.post('/presign', async (req, res, next) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !ALLOWED_PRESIGN_TYPES.includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file name or type.' });
    }

    const extension = path.extname(fileName);
    const key = `uploads/${uuidv4()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return res.status(200).json({
      uploadUrl,
      key,
      cdnUrl: `${process.env.CDN_BASE_URL}/${key}`,
    });
  } catch (error) {
    console.error('Presign URL error:', error);
    next(error);
  }
});

module.exports = router;