const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Compresses an image file in place (used for local/floorplan uploads).
 * @param {string} filePath - Absolute path to the image file.
 * @param {number} quality - Compression quality (1-100). Default 70.
 * @param {number} maxWidth - Maximum width of the image. Default 1920.
 */
const optimizeImage = async (filePath, quality = 70, maxWidth = 1920) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            return;
        }

        const tempPath = `${filePath}.tmp`;
        const image = sharp(filePath);
        const metadata = await image.metadata();

        let pipeline = image;
        if (metadata.width > maxWidth) {
            pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
        }

        if (ext === '.png') {
            pipeline = pipeline.png({ quality, palette: true });
        } else if (ext === '.webp') {
            pipeline = pipeline.webp({ quality });
        } else {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        }

        await pipeline.toFile(tempPath);
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);

        const newSize = fs.statSync(filePath).size;
        console.log(`Optimized: ${path.basename(filePath)} | Saved: ${((metadata.size - newSize) / 1024).toFixed(2)} KB`);
        return true;
    } catch (error) {
        console.error('Image optimization failed:', error);
        return false;
    }
};

/**
 * NEW — Optimizes an image from a Buffer and returns a new Buffer.
 * Used for R2 presigned uploads: optimize in memory before sending to cloud.
 *
 * @param {Buffer} inputBuffer - Raw file buffer (from multer memoryStorage).
 * @param {string} mimeType    - MIME type e.g. 'image/jpeg', 'image/png', 'image/webp'.
 * @param {number} quality     - Compression quality (1-100). Default 75.
 * @param {number} maxWidth    - Max width in px. Default 1920.
 * @returns {{ buffer: Buffer, contentType: string, ext: string }}
 */
const optimizeImageBuffer = async (inputBuffer, mimeType, quality = 75, maxWidth = 1920) => {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    let pipeline = image;
    if (metadata.width > maxWidth) {
        pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }

    // Always output as webp for maximum CDN efficiency (Step 12)
    // The CDN will serve this as image/webp — supported by all modern browsers.
    pipeline = pipeline.webp({ quality });

    const buffer = await pipeline.toBuffer();
    return {
        buffer,
        contentType: 'image/webp',
        ext: '.webp',
    };
};

/**
 * Saves a base64 image to disk and optimizes it (legacy — kept for compatibility).
 */
const saveAndOptimizeBase64 = async (base64String, filename, quality = 70, maxWidth = 1024) => {
    try {
        if (!base64String || !base64String.includes('base64,')) {
            return base64String;
        }

        const base64Data = base64String.split('base64,')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

        const filePath = path.join(uploadDir, filename);
        let pipeline = sharp(buffer);
        const metadata = await pipeline.metadata();

        if (metadata.width > maxWidth) {
            pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
        }

        const ext = path.extname(filename).toLowerCase();
        if (ext === '.png') {
            pipeline = pipeline.png({ quality, palette: true });
        } else if (ext === '.webp') {
            pipeline = pipeline.webp({ quality });
        } else {
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        }

        await pipeline.toFile(filePath);
        console.log(`Saved and optimized base64 image: ${filename}`);
        return filename;
    } catch (error) {
        console.error('Failed to save and optimize base64 image:', error);
        return null;
    }
};

module.exports = { optimizeImage, optimizeImageBuffer, saveAndOptimizeBase64 };