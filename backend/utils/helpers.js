const mongoose = require("mongoose");

const toObjectId = (id) => {
  // 1. If no ID is provided, return null (as per your original logic)
  if (!id) return null;

  // 2. Check if the string is a valid 24-character hex string
  // This prevents the "number" deprecation warning and catch-block overhead
  if (mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id); // Use 'new' keyword
  }

  // 3. If it's not a valid ID format, return null instead of crashing
  return null;
};

module.exports = { toObjectId };