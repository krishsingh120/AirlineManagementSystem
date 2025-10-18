const sender = require("../config/email.config");
const { TicketRepository } = require("../repository/index");


const repo = new TicketRepository();

const sendBasicMail = async (mailFrom, mailTo, mailSubject, mailBody) => {
    try {
        sender.sendMail({
            from: mailFrom,
            to: mailTo,
            subject: mailSubject,
            text: mailBody
        })
    } catch (error) {
        console.log("Something went wrong in service layer");
        throw error;
    }
}


const fetchPendingEmails = async (timeStamps) => {
    try {
        const ticket = await repo.get({ status: "PENDING" });
        return ticket;
    } catch (error) {
        console.log("Something went wrong in service layer");
        throw error;
    }
}

const updateTicket = async (ticketId, data) => {
    try {
        const response = await repo.update(ticketId, data);
        return response;
    } catch (error) {
        console.log("Something went wrong in service layer");
        throw error;
    }
}


const createNotification = async (data) => {
    try {
        const response = await repo.createTicket(data);
        return response;
    } catch (error) {
        console.log("Something went wrong in service layer");
        throw error;
    }
}

const subscribeEvent = async (payload) => {
    try {
        let service = payload.service;
        let data = payload.data;

        switch (service) {
            case 'CREATE_TICKET':
                await createNotification(data);
                break;
            case 'SEND_BASIC_MAIL':
                await sendBasicMail(data);
                break;
            default:
                console.log("No valid event recived");
                break;
        }
    } catch (error) {
        throw error;
    }
}




module.exports = {
    sendBasicMail,
    fetchPendingEmails,
    createNotification,
    updateTicket,
    subscribeEvent,
}



/**
 * SMTP → a@b.com
 * receiver → d@e.com
 *
 * from: support@noti.com
*/
