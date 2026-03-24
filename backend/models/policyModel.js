const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    policyKey: {
      type: String,
      required: true,
      unique: true,
      enum: ["tos", "privacy", "refund", "coc", "guidelines", "sponsor"],
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", policySchema);
