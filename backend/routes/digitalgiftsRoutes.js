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
} = require("../controllers/digitalgiftsController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

// Public / general auth routes
router.post("/redeem-by-code", requireAuth, redeemByCode);

// Require auth and admin/superadmin roles for these management routes
router.use(requireAuth);
router.use(requireRole("admin", "superadmin"));

router.get("/", getGifts);
router.get("/stats", getStats);
router.get("/assignments/recent", getRecentAssignments);
router.get("/:id", getGiftById);
router.post("/", createGift);
router.put("/:id", updateGift);
router.delete("/:id", deleteGift);
router.post("/:id/assign", assignGift);
router.patch("/:id/assignments/:assignmentId/redeem", redeemAssignment);

module.exports = router;
