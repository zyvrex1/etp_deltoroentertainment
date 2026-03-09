const express = require("express");
const router = express.Router();
const { purchaseTickets } = require("../controllers/ticketController");

router.post("/purchase", purchaseTickets);

module.exports = router;