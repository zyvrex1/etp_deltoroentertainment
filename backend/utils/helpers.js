const mongoose = require("mongoose");

const toObjectId = (id) => {
  if (!id) return null;
  try {
    return mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

module.exports = { toObjectId };