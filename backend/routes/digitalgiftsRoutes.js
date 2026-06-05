const express = require("express");
const {
  getGifts,
  getStats,
  getGiftById,
  createGift,
  updateGift,
  deleteGift,
  assignGift,
  redeemAssignment,
  redeemByCode,
  getRecentAssignments,
  getMyGifts,
} = require("../controllers/digitalgiftsController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Require auth for all routes below
router.use(requireAuth);

// Public / general auth routes
router.post("/redeem-by-code", redeemByCode);
router.get("/my-gifts", getMyGifts);
router.patch("/:id/assignments/:assignmentId/redeem", redeemAssignment);

// Require admin/superadmin roles for these management routes
router.use(requireRole("admin", "superadmin"));

router.get("/", getGifts);
router.get("/stats", getStats);
router.get("/assignments/recent", getRecentAssignments);
router.get("/:id", getGiftById);
router.post("/", createGift);
router.put("/:id", updateGift);
router.delete("/:id", deleteGift);
router.post("/:id/assign", assignGift);

module.exports = router;
