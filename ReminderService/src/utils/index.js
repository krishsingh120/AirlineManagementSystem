const { createChannel, subscribeMessage } = require("./messageQueue");
const { REMINDER_BINDING_KEY } = require("../config/server.config");
const EmailService = require("../service/email.service");


const msgServiceCall = async () => {
    try {
        const channel = await createChannel();
        subscribeMessage(channel, EmailService.subscribeEvent, REMINDER_BINDING_KEY);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    msgServiceCall,
}