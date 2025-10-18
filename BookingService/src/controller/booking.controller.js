const { BookingService } = require("../services/index");
const { StatusCodes } = require("http-status-codes");
const { createChannel, publishMessage, subscribeMessage } = require("../utils/messageQueue");
const { REMINDER_BINDING_KEY } = require("../config/serverConfig");
const services = require("../services/index");




const bookingService = new BookingService();

class BookingController {

    constructor() {

    }

    async sendMessageToQueue(req, res) {
        const channel = await createChannel();
        const payload = {
            data: {
                subject: "This is a noti from queue",
                content: "Some queue will subscribe this",
                recepientEmail: "singhkrish2254@gmail.com",
                notificationTime: "2025-09-20 10:45:00"
            },
            service: "CREATE_TICKET"
        };
        publishMessage(channel, REMINDER_BINDING_KEY, JSON.stringify(payload));
        return res.status(200).json({
            message: "Successfully published the event"
        })
    }

    async create(req, res) {
        try {
            const response = await bookingService.createBooking(req.body);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully completed booking',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                // message: error.message,
                // success: false,
                // err: error.explanation,
                // data: {}

                message: error.message || 'Something went wrong',
                success: false,
                err: error.explanation || {},
                data: {}
            });
        }
    }



}





module.exports = BookingController;