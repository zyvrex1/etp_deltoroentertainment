const express = require("express");
const {
  createVenue,
  getVenues,
  deleteVenue,
  updateVenue,
  getVenue,
} = require("../controllers/venueController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/", getVenues);
router.get("/:id", getVenue);

// Protected routes (modification requires admin/superadmin)
router.post("/", requireAuth, requireRole("admin", "superadmin"), createVenue);
router.put("/:id", requireAuth, requireRole("admin", "superadmin"), updateVenue);
router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), deleteVenue);

module.exports = router;