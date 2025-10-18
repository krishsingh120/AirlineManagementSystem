const axios = require("axios");
const { BookingRepository } = require("../repository/index");
const { ServiceError } = require("../utils/errors");
const { FLIGHT_SERVICE_PATH } = require("../config/serverConfig");



class BookingService {
    constructor() {
        this.bookingRepository = new BookingRepository();
    }
    async createBooking(data) {
        try {
            const { flightId, userId, noOfSeats } = data;

            // axios api call
            const getFlightRequestUrl = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
            const response = await axios.get(getFlightRequestUrl)

            const flightData = response.data.data;
            const priceOfFlight = flightData.price;
            const flightSeats = flightData.totalSeats;

            if (noOfSeats > flightSeats) {
                throw new ServiceError(
                    'Something went wrong in booking priocess',
                    'Insufficient seats int the flight',

                )
            }


            let totalCost = priceOfFlight * noOfSeats;
            const bookingPayload = { ...data, totalCost };

            const booking = await this.bookingRepository.create(bookingPayload);

            const updateFlightReqUrl = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            const updateResponse = await axios.patch(updateFlightReqUrl, { totalSeats: flightData.totalSeats - noOfSeats });
            const updatedFlight = updateResponse.data.data;


            const updatedBooking = await this.bookingRepository.update(booking.id, { status: "BOOKED" });

            return { ...updatedBooking.dataValues, ...updatedFlight };

        } catch (error) {
            if (error.name === 'RepositoryError' || error.name === 'ValidationError') {
                throw error;
            }
            throw new ServiceError();
        }
    }
}

module.exports = BookingService;