const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf|doc|docx|zip/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPG, PNG, WEBP, PDF, DOC, DOCX, ZIP'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;