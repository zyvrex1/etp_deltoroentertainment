const express = require('express')
const router = express.Router()

const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

// const requireAuth = require('../middleware/requireAuth')

// // Protect all routes
// router.use(requireAuth)

router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.patch("/:id", updateAnnouncement);
router.delete("/:id", deleteAnnouncement);

module.exports = router;