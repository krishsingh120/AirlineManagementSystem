const { where, Op } = require("sequelize");
const { NotificationTicket } = require("../models/index");


class TicketRepository {

    async getAll() {
        try {
            const tickets = await NotificationTicket.findAll();
            return tickets;
        } catch (error) {
            console.log("Something went wrong in repository layer: ", error);
        }
    }

    async createTicket(data) {
        try {
            const ticket = await NotificationTicket.create(data);
            return ticket;
        } catch (error) {
            console.log("Something went wrong in repository layer: ", error);
        }
    }

    async get(filter) {
        try {
            const tickets = await NotificationTicket.findAll({
                where: {
                    status: filter.status,
                    notificationTime: {
                        [Op.lte]: new Date()
                    }
                }
            })

            return tickets;
        } catch (error) {
            console.log("Something went wrong in repository layer: ", error);
        }
    }

    async update(ticketId, data) {
        try {
            const ticket = await NotificationTicket.findByPk(ticketId);
            if (data?.status) {
                ticket.status = data.status;
            }
            await ticket.save();
            return ticket;
        } catch (error) {
            console.log("Something went wrong in repository layer: ", error);
        }
    }
}

module.exports = TicketRepository;