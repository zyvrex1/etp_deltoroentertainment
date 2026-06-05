const DigitalGift = require("../models/digitalgiftsModel");

/* =========================
   HELPERS
========================= */

const handleError = (res, error, status = 500) => {
  console.error("[DigitalGift]", error.message);
  return res.status(status).json({ success: false, message: error.message });
};

/* =========================
   GIFT CRUD
========================= */

/**
 * GET /api/digital-gifts
 * List all gifts with optional filtering & search.
 */
exports.getGifts = async (req, res) => {
  try {
    const { status, type, assignedTo, search } = req.query;

    const filter = {};
    if (status)     filter.status     = status;
    if (type)       filter.type       = type;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      const q = new RegExp(search, "i");
      filter.$or = [{ name: q }, { code: q }];
    }

    const gifts = await DigitalGift.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: gifts });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/digital-gifts/stats
 * Returns the four summary stats used by the frontend dashboard.
 */
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [totalActive, allGifts, expiringThisWeek] = await Promise.all([
      DigitalGift.countDocuments({ status: "active" }),
      DigitalGift.find({}, "usedCount totalCount value valueType"),
      DigitalGift.countDocuments({
        status:    "active",
        expiresAt: { $gte: now, $lte: weekFromNow },
      }),
    ]);

    const totalRedeemed = allGifts.reduce((sum, g) => sum + (g.usedCount || 0), 0);
    const totalValueIssued = allGifts
      .filter((g) => g.valueType === "fixed")
      .reduce((sum, g) => sum + (g.value || 0) * (g.totalCount || 0), 0);

    return res.status(200).json({
      success: true,
      data: { totalActive, totalRedeemed, totalValueIssued, expiringThisWeek },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/digital-gifts/:id
 * Get a single gift by ID.
 */
exports.getGiftById = async (req, res) => {
  try {
    const gift = await DigitalGift.findById(req.params.id);
    if (!gift) return res.status(404).json({ success: false, message: "Gift not found." });

    return res.status(200).json({ success: true, data: gift });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * POST /api/digital-gifts
 * Create a new gift.
 */
exports.createGift = async (req, res) => {
  try {
    const {
      name, type, value, valueType, description,
      assignedTo, code, totalCount, expiresAt, status,
    } = req.body;

    const existing = await DigitalGift.findOne({ code: code?.toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Gift code already exists." });
    }

    const gift = await DigitalGift.create({
      createdBy: req.user._id,
      name, type, value, valueType, description,
      assignedTo, code, totalCount, expiresAt,
      status: status || "draft",
    });

    return res.status(201).json({ success: true, data: gift });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * PUT /api/digital-gifts/:id
 * Update an existing gift.
 */
exports.updateGift = async (req, res) => {
  try {
    const gift = await DigitalGift.findById(req.params.id);
    if (!gift) return res.status(404).json({ success: false, message: "Gift not found." });

    // If code is being changed, ensure it's still unique
    if (req.body.code && req.body.code.toUpperCase() !== gift.code) {
      const existing = await DigitalGift.findOne({ code: req.body.code.toUpperCase() });
      if (existing) {
        return res.status(409).json({ success: false, message: "Gift code already exists." });
      }
    }

    const allowed = [
      "name", "type", "value", "valueType", "description",
      "assignedTo", "code", "totalCount", "expiresAt", "status",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) gift[field] = req.body[field];
    });

    await gift.save();
    return res.status(200).json({ success: true, data: gift });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * DELETE /api/digital-gifts/:id
 * Delete a gift.
 */
exports.deleteGift = async (req, res) => {
  try {
    const gift = await DigitalGift.findByIdAndDelete(req.params.id);
    if (!gift) return res.status(404).json({ success: false, message: "Gift not found." });

    return res.status(200).json({ success: true, message: "Gift deleted successfully." });
  } catch (error) {
    return handleError(res, error);
  }
};

/* =========================
   ASSIGNMENTS
========================= */

/**
 * POST /api/digital-gifts/:id/assign
 * Assign a gift to a user.
 * Body: { userId, userName, userEmail, userRole }
 */
exports.assignGift = async (req, res) => {
  try {
    const gift = await DigitalGift.findById(req.params.id);
    if (!gift) return res.status(404).json({ success: false, message: "Gift not found." });

    if (!gift.isRedeemable) {
      return res.status(400).json({ success: false, message: "Gift is not available for assignment." });
    }

    const { userId, userName, userEmail, userRole } = req.body;

    if (!userId || !userRole) {
      return res.status(400).json({ success: false, message: "userId and userRole are required." });
    }

    // Check audience eligibility
    if (gift.assignedTo !== "all" && gift.assignedTo !== `${userRole}s`) {
      return res.status(403).json({
        success: false,
        message: `This gift is only available for ${gift.assignedTo}.`,
      });
    }

    // Prevent duplicate assignment to same user
    const alreadyAssigned = gift.assignments.some(
      (a) => a.userId.toString() === userId && a.status === "pending"
    );
    if (alreadyAssigned) {
      return res.status(409).json({ success: false, message: "User already has a pending assignment for this gift." });
    }

    gift.assignments.push({ userId, userName, userEmail, userRole });
    await gift.save();

    return res.status(201).json({ success: true, data: gift });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * PATCH /api/digital-gifts/:id/assignments/:assignmentId/redeem
 * Mark an assignment as redeemed and increment usedCount.
 */
exports.redeemAssignment = async (req, res) => {
  try {
    const gift = await DigitalGift.findById(req.params.id);
    if (!gift) return res.status(404).json({ success: false, message: "Gift not found." });

    const assignment = gift.assignments.id(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, message: "Assignment not found." });

    if (assignment.status === "redeemed") {
      return res.status(400).json({ success: false, message: "Assignment already redeemed." });
    }

    if (!gift.isRedeemable) {
      return res.status(400).json({ success: false, message: "Gift is no longer redeemable." });
    }

    assignment.status     = "redeemed";
    assignment.redeemedAt = new Date();
    gift.usedCount        += 1;

    await gift.save();
    return res.status(200).json({ success: true, data: gift });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * POST /api/digital-gifts/redeem-by-code
 * Public-facing endpoint — redeem a gift by its code string.
 * Body: { code }
 */
exports.redeemByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "code is required." });

    const gift = await DigitalGift.redeemByCode(code);
    if (!gift) {
      return res.status(400).json({ success: false, message: "Invalid, expired, or fully redeemed gift code." });
    }

    return res.status(200).json({ success: true, data: gift });
  } catch (error) {
    return handleError(res, error);
  }
};

/**
 * GET /api/digital-gifts/assignments/recent
 * Returns the most recent assignments across all gifts (for the dashboard table).
 */
exports.getRecentAssignments = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const gifts = await DigitalGift.find(
      { "assignments.0": { $exists: true } },
      "name code assignments"
    );

    // Flatten all assignments, attach gift context, sort by assignedAt desc
    const flat = gifts.flatMap((g) =>
      g.assignments.map((a) => ({
        assignmentId: a._id,
        giftId:       g._id,
        giftName:     g.name,
        code:         g.code,
        userId:       a.userId,
        userName:     a.userName,
        userEmail:    a.userEmail,
        userRole:     a.userRole,
        status:       a.status,
        assignedAt:   a.assignedAt,
        redeemedAt:   a.redeemedAt,
      }))
    );

    flat.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));

    return res.status(200).json({ success: true, data: flat.slice(0, limit) });
  } catch (error) {
    return handleError(res, error);
  }
};