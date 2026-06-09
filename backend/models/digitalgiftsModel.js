const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* =========================
   SUB-SCHEMAS
========================= */

const giftAssignmentSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    userRole: { type: String, enum: ["customer", "sponsor"], required: true },
    status: { type: String, enum: ["pending", "redeemed"], default: "pending" },
    assignedAt: { type: Date, default: Date.now },
    redeemedAt: { type: Date, default: null },
});

/* =========================
   MAIN SCHEMA
========================= */

const digitalGiftSchema = new Schema(
    {
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },

        type: {
            type: String,
            enum: ["gift_card", "discount", "promo"],
            required: true,
        },

        value: { type: Number, default: null, min: 0 },
        valueType: {
            type: String,
            enum: ["fixed", "percent", "bxgy"],
            required: true,
        },

        assignedTo: {
            type: String,
            enum: ["customers", "sponsors", "all"],
            default: "all",
        },

        status: {
            type: String,
            enum: ["active", "draft", "expired"],
            default: "draft",
        },

        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            unique: true,
        },

        usedCount: { type: Number, default: 0, min: 0 },
        totalCount: { type: Number, required: true, min: 1 },

        expiresAt: { type: Date, default: null },

        assignments: { type: [giftAssignmentSchema], default: [] },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

/* =========================
   PRE-SAVE HOOK
========================= */

digitalGiftSchema.pre("save", function (next) {
    // Auto-expire if past expiry date and still marked active
    if (this.status === "active" && this.expiresAt && new Date(this.expiresAt) < new Date()) {
        this.status = "expired";
    }

    // Cap usedCount to totalCount
    if (this.usedCount > this.totalCount) {
        this.usedCount = this.totalCount;
    }

    // Auto-expire when fully redeemed
    if (this.status === "active" && this.usedCount >= this.totalCount) {
        this.status = "expired";
    }

    // percent value must be 1–100
    if (this.valueType === "percent" && this.value != null) {
        if (this.value < 1 || this.value > 100) {
            return next(new Error("Percent value must be between 1 and 100."));
        }
    }

    // bxgy gifts carry no numeric value
    if (this.valueType === "bxgy") {
        this.value = null;
    }

    next();
});

/* =========================
   VIRTUALS
========================= */

digitalGiftSchema.virtual("remainingCount").get(function () {
    return Math.max(0, this.totalCount - this.usedCount);
});

digitalGiftSchema.virtual("isRedeemable").get(function () {
  return (
    this.status === "active" &&
    this.usedCount < this.totalCount &&
    (this.expiresAt === null || new Date(this.expiresAt) >= new Date())
  );
});

digitalGiftSchema.virtual("redemptionRate").get(function () {
    if (!this.totalCount) return 0;
    return parseFloat(((this.usedCount / this.totalCount) * 100).toFixed(2));
});

/* =========================
   STATICS
========================= */

/**
 * Atomically redeem a gift by code.
 * Increments usedCount only if the gift is still redeemable.
 */
digitalGiftSchema.statics.redeemByCode = async function (code) {
    return await this.findOneAndUpdate(
        {
            code: code.toUpperCase(),
            status: "active",
            $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
             $expr: { $lt: ["$usedCount", "$totalCount"] },
        },
        { $inc: { usedCount: 1 } },
        { new: true }
    );
};

/* =========================
   INDEXES
========================= */

digitalGiftSchema.index({ status: 1 });
digitalGiftSchema.index({ type: 1 });
digitalGiftSchema.index({ createdBy: 1 });
digitalGiftSchema.index({ expiresAt: 1 });

module.exports = mongoose.model("DigitalGift", digitalGiftSchema);