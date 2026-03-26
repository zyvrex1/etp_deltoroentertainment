const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    policyKey: {
      type: String,
      required: true,
      unique: true,
      enum: ["tos", "privacy", "refund", "cp", "guidelines", "sponsor"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", policySchema);
