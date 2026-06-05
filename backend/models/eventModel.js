const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ticketLayoutSchema = new Schema({
  priceLevelId: { type: Schema.Types.ObjectId, required: true },
  layout: { type: Schema.Types.Mixed, default: [] },
  themeColor: { type: String, default: "#D32F2F" }
});

const priceLevelSchema = new Schema({
  priceName: { type: String, required: true },
  description: String,
  color: String,

  facePrice: { type: Number, min: 0, required: true },
  serviceCharge: { type: Number, default: 0 },

  type: { type: String, default: "Seat (Circle)" },
  boothSize: { type: String, default: "" },

  minPerOrder: { type: Number, default: 1 },
  maxPerOrder: { type: Number, default: 30 },
  increment: { type: Number, default: 1 },

  quantityAvailable: { type: Number, default: 0 },

  quantitySold: {
    type: Number,
    default: 0,
  },

  isActive: { type: Boolean, default: true },
});

const seatSchema = new Schema({
  type: { type: String, enum: ["Seat", "Table"], default: "Seat" },
  shape: { type: String, enum: ["Circle", "Rect"], default: "Circle" }, // CRITICAL FOR KONVA
  seatCount: { type: Number, default: 1 },
  occupiedSeats: { type: Number, default: 0 },
  unassignedIndices: { type: [Number], default: [] },
  color: String,
  row: String,
  number: Number,
  label: String,
  status: {
    type: String,
    enum: ["available", "reserved", "sold", "blocked", "partially-sold"],
    default: "available",
  },
  reservedBy: { type: String, default: "" },
  reservedByEmail: { type: String, default: "" },
  reservedByPO: { type: String, default: "" },
  // Changed to Mixed to allow "none" or Null without casting errors
  priceLevelId: { type: Schema.Types.Mixed, default: null },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, default: 40 },
  height: { type: Number, default: 40 },
  rotation: { type: Number, default: 0 },
  scaleX: { type: Number, default: 1 }, // <--- ADD THIS
  scaleY: { type: Number, default: 1 }, // <--- ADD THIS
});

const sectionSchema = new Schema({
  name: String,
  seats: [seatSchema],
});

const elementSchema = new Schema({
  type: { type: String, default: "Element" },
  label: { type: String, required: true },
  shape: { type: String, enum: ["Rect", "Circle"], default: "Rect" },
  color: { type: String, default: "#CCCCCC" },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  rotation: { type: Number, default: 0 },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  isLocked: { type: Boolean, default: false }
});


const layoutItemSchema = new Schema({
  type: { type: String, default: "Background" },
  subType: { type: String, enum: ["Image", "Shape"], default: "Image" },
  imageUrl: String,
  color: String,
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: Number,
  height: Number,
  rotation: { type: Number, default: 0 },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  opacity: { type: Number, default: 1 }
});

const seatMapSchema = new Schema({
  width: { type: Number, default: 1400 },
  height: { type: Number, default: 500 },
  sections: [sectionSchema],
  elements: [elementSchema],      // <--- STAGE, BAR, etc.
  backgrounds: [layoutItemSchema]  // <--- FLOOR PLAN IMAGE
});

const boothSchema = new mongoose.Schema({
  type: { type: String, default: "Booth" },
  code: String,
  label: String,
  status: {
    type: String,
    enum: ["available", "reserved", "sold", "blocked"],
    default: "available"
  },
  reservedBy: { type: String, default: "" },
  reservedByEmail: { type: String, default: "" },
  reservedByPO: { type: String, default: "" },
  x: Number,
  y: Number,
  width: { type: Number, default: 60 },
  height: { type: Number, default: 60 },
  rotation: { type: Number, default: 0 },
  priceLevelId: { type: Schema.Types.Mixed, default: null }, // Changed to Mixed
  scaleX: { type: Number, default: 1 }, // <--- ADD THIS
  scaleY: { type: Number, default: 1 }, // <--- ADD THIS
});

const eventSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      enum: ["General Admission", "Reservation", "Seating Arrangement", "Exhibition"],
    },

    description: String,
    category: { type: String, required: true, trim: true },

    venue: {
      type: {
        _id: { type: Schema.Types.ObjectId, ref: "Venue" },
        name: String,
        address: String,
        city: String,
        zipCode: String,
      },
      required: true,
    },

    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          // 1. If we are creating a NEW document
          if (this.startDate) {
            return value >= this.startDate;
          }

          // 2. If we are UPDATING an existing document
          // Get the update object from the query context
          const update = this.getUpdate ? this.getUpdate() : null;

          // If we are updating startDate in this request, use that.
          // Otherwise, we skip this check and rely on the Controller logic 
          // because the validator can't easily see the old value in the DB.
          if (update && update.$set && update.$set.startDate) {
            return value >= new Date(update.$set.startDate);
          }

          return true;
        },
        message: "End date must be after start date",
      },
    },

    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    image: String,

    priceLevels: { type: [priceLevelSchema], default: [] },

    seatMap: { type: seatMapSchema, default: null },

    hasBooths: { type: Boolean, default: false },

    booths: { type: [boothSchema], default: [] },



    seatRevenue: { type: Number, default: 0 },
    boothRevenue: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "completed"],
      default: "pending",
    },

    isFeatured: { type: Boolean, default: false },
    assignedPromoters: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },

    // Editor data for LayoutBuilder
    ticketCategories: { type: Schema.Types.Mixed, default: [] },
    layoutData: { type: Schema.Types.Mixed, default: null },

    // Ticket Layouts
    ticketLayouts: { type: [ticketLayoutSchema], default: [] },

    rejectionReason: { type: String, default: "" },
    cancellationReason: { type: String, default: "" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

eventSchema.pre("save", function (next) {
  const priceIds = (this.priceLevels || [])
    .map((p) => (p && p._id ? p._id.toString() : null))
    .filter(Boolean);

  // 1. Logic for Seating Arrangement - CLEANUP & Validation
  if (
    (this.eventType === "Seating Arrangement" ||
      this.eventType === "Reservation") &&
    this.seatMap
  ) {
    if (this.seatMap.sections) {
      for (const section of this.seatMap.sections) {
        if (!section.seats) continue;
        for (const seat of section.seats) {
          if (seat.status === "available") {
            seat.reservedBy = "";
            seat.reservedByEmail = "";
            seat.reservedByPO = "";
          }
          if (seat.priceLevelId && seat.priceLevelId !== "none") {
            if (!priceIds.includes(seat.priceLevelId.toString())) {
              // Instead of failing, we clean up the dangling reference
              console.warn(`Cleaning up invalid priceLevelId on seat ${seat.label}`);
              seat.priceLevelId = "none";
              seat.status = "available"; // Reset status if it was sold with invalid price
            }
          }
        }
      }
    }
  }

  // 2. Logic for General Admission
  if (this.eventType === "General Admission") {
    this.seatMap = null;
  }

  // 3. Logic for Booths - CLEANUP & Validation
  if (this.hasBooths && this.booths) {
    for (const booth of this.booths) {
      if (booth.status === "available") {
        booth.reservedBy = "";
        booth.reservedByEmail = "";
        booth.reservedByPO = "";
      }
      if (booth.priceLevelId && booth.priceLevelId !== "none") {
        if (!priceIds.includes(booth.priceLevelId.toString())) {
          console.warn(`Cleaning up invalid priceLevelId on booth ${booth.code || booth.label}`);
          booth.priceLevelId = "none";
          booth.status = "available";
        }
      }
    }
  }

  // 4. Cleanup layoutData items
  if (this.layoutData && Array.isArray(this.layoutData.items)) {
    this.layoutData.items = this.layoutData.items.filter(item => {
      if (item.status === "available") {
        item.reservedBy = "";
        item.reservedByEmail = "";
        item.reservedByPO = "";
      }
      // If it's a shape (has categoryId), check if category still exists
      if (item.categoryId) {
        return priceIds.includes(item.categoryId.toString());
      }
      return true; // Keep elements/backgrounds
    });
    this.markModified('layoutData');
  }

  // 5. Revenue & Progress Calculations
  let seatRevenue = 0;
  let boothRevenue = 0;
  let ticketsSold = 0;
  const priceMap = {};
  this.priceLevels.forEach((p) => {
    if (p && p._id) {
      priceMap[p._id.toString()] = p;
    }
  });

  // Calculate Seat/Table Revenue & Progress
  if (this.seatMap && this.seatMap.sections) {
    for (const section of this.seatMap.sections) {
      if (!section.seats) continue;
      for (const seat of section.seats) {
        if (
          (seat.status === "sold" || seat.status === "partially-sold") &&
          seat.priceLevelId &&
          seat.priceLevelId !== "none"
        ) {
          const p = priceMap[seat.priceLevelId.toString()];
          if (p) {
            const soldCount =
              seat.type === "Table" || seat.seatCount > 1
                ? seat.occupiedSeats || 0
                : 1;

            seatRevenue +=
              ((p.facePrice || 0) + (p.serviceCharge || 0)) * soldCount;
            ticketsSold += soldCount;
          }
        }
      }
    }
  }

  // Calculate Booth Revenue & Progress
  if (this.hasBooths && this.booths) {
    for (const booth of this.booths) {
      if (
        booth.priceLevelId &&
        booth.priceLevelId !== "none" &&
        !priceIds.includes(booth.priceLevelId.toString())
      ) {
        return next(
          new Error(
            `Booth ${booth.code || booth.label} has invalid priceLevelId`,
          ),
        );
      }
      if (
        booth.status === "sold" &&
        booth.priceLevelId &&
        booth.priceLevelId !== "none"
      ) {
        const p = priceMap[booth.priceLevelId.toString()];
        if (p) {
          boothRevenue += (p.facePrice || 0) + (p.serviceCharge || 0);
        }
      }
    }
  }

  this.seatRevenue = seatRevenue;
  this.boothRevenue = boothRevenue;

  next();
});


eventSchema.virtual("totalBooths").get(function () {
  const isExhibition =
    this.eventType === "Exhibition" ||
    this.eventType === "Seating Arrangement" ||
    this.eventType === "Reservation";

  if (isExhibition) {
    if (this.layoutData && Array.isArray(this.layoutData.items)) {
      const layoutBooths = this.layoutData.items.filter(
        (i) => (i.type || "").toLowerCase() === "booth"
      );
      return layoutBooths.length;
    }
    return (this.booths || []).length;
  }

  // For General Admission or other types, we might not have booths at all
  return (this.booths || []).length;
});

eventSchema.virtual("boothsSold").get(function () {
  const isExhibition =
    this.eventType === "Exhibition" ||
    this.eventType === "Seating Arrangement" ||
    this.eventType === "Reservation";

  if (isExhibition) {
    if (this.layoutData && Array.isArray(this.layoutData.items)) {
      return this.layoutData.items.filter(
        (i) => (i.type || "").toLowerCase() === "booth" && i.status === "sold"
      ).length;
    }
    return (this.booths || []).filter(b => b.status === "sold").length;
  }

  return (this.booths || []).filter(b => b.status === "sold").length;
});

eventSchema.virtual("boothsReserved").get(function () {
  if (this.layoutData && Array.isArray(this.layoutData.items)) {
    const layoutBooths = this.layoutData.items.filter(
      (i) => (i.type || "").toLowerCase() === "booth"
    );
    if (layoutBooths.length > 0) {
      return layoutBooths.filter(i => i.status === "reserved").length;
    }
  }
  return (this.booths || []).filter(b => b.status === "reserved").length;
});

eventSchema.virtual("totalTickets").get(function () {
  const isSeated =
    this.eventType === "Seating Arrangement" ||
    this.eventType === "Exhibition" ||
    this.eventType === "Reservation";

  if (isSeated) {
    // 1. Strictly use layoutData if it exists
    if (this.layoutData && Array.isArray(this.layoutData.items)) {
      return this.layoutData.items.filter(
        (i) => (i.type || "").toLowerCase() === "seat"
      ).length;
    }

    // 2. Fallback to legacy seatMap only
    if (this.seatMap && Array.isArray(this.seatMap.sections)) {
      let total = 0;
      this.seatMap.sections.forEach((s) => {
        (s.seats || []).forEach((seat) => {
          total += seat.seatCount || 1;
        });
      });
      return total;
    }

    // If it's supposed to be seated but nothing is placed, total is 0
    return 0;
  }

  // 3. For General Admission, use price level quantities
  return (this.priceLevels || []).reduce(
    (sum, p) => sum + (p.quantityAvailable || 0),
    0
  );
});

eventSchema.virtual("ticketsReserved").get(function () {
  let reservedCount = 0;

  // 1. Count from layoutData
  if (this.layoutData && Array.isArray(this.layoutData.items)) {
    reservedCount = this.layoutData.items.filter(
      (item) => (item.type || "").toLowerCase() === "seat" && item.status === "reserved"
    ).length;
  }

  // 2. Count from legacy seatMap
  if (this.seatMap && Array.isArray(this.seatMap.sections)) {
    this.seatMap.sections.forEach((s) => {
      (s.seats || []).forEach((seat) => {
        if (seat.status === "reserved") {
          reservedCount += seat.seatCount || 1;
        }
      });
    });
  }

  return reservedCount;
});

eventSchema.virtual("ticketsSold").get(function () {
  const isSeated =
    this.eventType === "Seating Arrangement" ||
    this.eventType === "Exhibition" ||
    this.eventType === "Reservation";

  if (isSeated) {
    // 1. Strictly use layoutData if it exists
    if (this.layoutData && Array.isArray(this.layoutData.items)) {
      return this.layoutData.items.filter(
        (item) => (item.type || "").toLowerCase() === "seat" && item.status === "sold"
      ).length;
    }

    // 2. Count from legacy seatMap
    if (this.seatMap && Array.isArray(this.seatMap.sections)) {
      let legacySeatsSold = 0;
      this.seatMap.sections.forEach((s) => {
        (s.seats || []).forEach((seat) => {
          if (seat.status === "sold" || seat.status === "partially-sold") {
            legacySeatsSold += (seat.type === "Table" || seat.seatCount > 1)
              ? (seat.occupiedSeats || 0)
              : 1;
          }
        });
      });
      return legacySeatsSold;
    }

    return 0; // Seated event with no layout/seatMap = 0 sold
  }

  // 3. For General Admission, use price level statistics
  return (this.priceLevels || []).reduce(
    (sum, p) => sum + (p.quantitySold || 0),
    0
  );
});

eventSchema.virtual("totalRevenue").get(function () {
  return this.seatRevenue + this.boothRevenue;
});

eventSchema.statics.reserveSeat = async function (eventId, sectionName, seatId, userId) {
  return await this.findOneAndUpdate(
    {
      _id: eventId,
      "seatMap.sections.name": sectionName,
      "seatMap.sections.seats": {
        $elemMatch: {
          _id: seatId,
          status: "available" // CRITICAL: Only match if it's still available
        }
      }
    },
    {
      $set: {
        "seatMap.sections.$[section].seats.$[seat].status": "reserved",
        "seatMap.sections.$[section].seats.$[seat].reservedBy": userId
      }
    },
    {
      arrayFilters: [
        { "section.name": sectionName },
        { "seat._id": seatId }
      ],
      new: true // Returns the updated document
    }
  );
};

/* =========================
   INDEXES
========================= */
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ "venue._id": 1 });
eventSchema.index({ category: 1 });

module.exports = mongoose.model("Event", eventSchema);