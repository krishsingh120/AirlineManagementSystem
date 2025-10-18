const { StatusCodes } = require("http-status-codes");
const { Booking } = require("../models/index");
const { ValidationError, AppError } = require("../utils/errors");



class BookingRepository {
    async create(data) {
        try {
            const booking = await Booking.create(data);
            return booking;
        } catch (error) {
            if (error.name === "sequelizeValidationError") {
                throw new ValidationError(error);
            }
            throw new AppError(
                'RepositoryError',
                'Cannont create booking',
                'There was some issue for creating a booking, Please try again later',
                StatusCodes.INTERNAL_SERVER_ERROR
            )
        }
    }

    async update(bookingId, data) {
        try {
            await Booking.update(data, {
                where: { id: bookingId }
            });

            // fetch the updated row
            const updatedBooking = await Booking.findByPk(bookingId);
            return updatedBooking;
        } catch (error) {
            throw new AppError(
                'RepositoryError',
                'Cannot update booking',
                'There was some issue updating the booking, Please try again later',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }


}


module.exports = BookingRepository;