const express = require("express");
const { BookingController } = require("../../controller/index");
const { createChannel } = require("..//../utils/messageQueue");


const bookingController = new BookingController();
const router = express.Router();


router.get("/info", (req, res) => {
    return res.json({
        message: "Hitting Booking service"
    })
})


router.post('/bookings', bookingController.create);
router.post('/publish', bookingController.sendMessageToQueue);





module.exports = router;