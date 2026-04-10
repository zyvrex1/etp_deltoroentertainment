const express = require('express')
const router = express.Router()

const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

router.get("/", getAnnouncements);

const requireAuth = require('../middleware/requireAuth')

// Protect other routes
router.use(requireAuth)

router.post("/", createAnnouncement);
router.patch("/:id", updateAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;