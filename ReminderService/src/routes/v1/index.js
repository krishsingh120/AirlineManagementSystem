const express = require("express");
const router = express.Router();
const ticketController = require("../../controller/ticket.controller")

// Routes. => /api/v1/tickets
router.post("/tickets", ticketController.create);


module.exports = router;

