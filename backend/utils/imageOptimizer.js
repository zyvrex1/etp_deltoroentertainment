const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Compresses an image file in place or to a new destination.
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
        // Skip non-image files if any accidentally get passed
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            return;
        }

        const tempPath = `${filePath}.tmp`;
        
        // Load the image
        const image = sharp(filePath);
        const metadata = await image.metadata();

        // Only resize if it's larger than maxWidth
        let pipeline = image;
        if (metadata.width > maxWidth) {
            pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
        }

        // Apply compression based on format
        if (ext === '.png') {
            pipeline = pipeline.png({ quality, palette: true });
        } else if (ext === '.webp') {
            pipeline = pipeline.webp({ quality });
        } else {
            // Default to jpeg/jpg
            pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        }

        // Write to temp file first
        await pipeline.toFile(tempPath);

        // Replace original with compressed version
        fs.unlinkSync(filePath);
        fs.renameSync(tempPath, filePath);

        const newSize = fs.statSync(filePath).size;
        console.log(`Optimized image: ${path.basename(filePath)} | Size reduction: ${((metadata.size - newSize) / 1024).toFixed(2)} KB`);
        
        return true;
    } catch (error) {
        console.error('Image optimization failed:', error);
        return false;
    }
};

/**
 * Saves a base64 image to disk and optimizes it.
 * @param {string} base64String - The base64 encoded image.
 * @param {string} filename - Desired filename.
 * @param {number} quality - Compression quality.
 * @param {number} maxWidth - Maximum width.
 * @returns {string} - The saved filename.
 */
const saveAndOptimizeBase64 = async (base64String, filename, quality = 70, maxWidth = 1024) => {
    try {
        if (!base64String || !base64String.includes('base64,')) {
            return base64String; // Return as is if not base64
        }

        const base64Data = base64String.split('base64,')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        const filePath = path.join(uploadDir, filename);
        
        // Use sharp to process the buffer directly
        let pipeline = sharp(buffer);
        const metadata = await pipeline.metadata();

        if (metadata.width > maxWidth) {
            pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
        }

        // Apply compression based on the extension of the filename
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

module.exports = { optimizeImage, saveAndOptimizeBase64 };
