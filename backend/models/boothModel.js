const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const boothSchema = new Schema(
{
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true
  },

  boothNumber: {
    type: String,
    required: true
  },

  size: String,

  price: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: [
      "available",
      "reserved",
      "sold"
    ],
    default: "available"
  },

  sponsorId: {
    type: Schema.Types.ObjectId,
    ref: "Sponsor"
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Booth", boothSchema);