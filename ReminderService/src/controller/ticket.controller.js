const ticketService = require("../service/email.service");

// const ticketservice = new ticketService();

const create = async (req, res) => {
    try {
        const response = await ticketService.createNotification(req.body);
        return res.status(201).json({
            success: true,
            data: response,
            message: "Successfully registered an email reminder.",
            err: {}
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            data: {},
            message: "Unable to register an email reminder.",
            err: error
        })
    }
}


module.exports = {
    create
}