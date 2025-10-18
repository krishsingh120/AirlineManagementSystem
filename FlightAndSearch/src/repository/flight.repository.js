const { Op, where } = require("sequelize");
const { Flights } = require("../models/index");

class FlightRepository {

    #createFilter(data) {   // # -> means this method is private
        const filter = {};
        if (data.arrivalAirportId) {
            filter.arrivalAirportId = data.arrivalAirportId;
        }

        if (data.departureAirportId) {
            filter.departureAirportId = data.departureAirportId;
        }

        // // both parameters are presents this will run
        // if (data.minPrice && data.maxPrice) {
        //     Object.assign(filter, {
        //         [Op.and]: [
        //             { [Op.gte]: data.minPrice },
        //             { [Op.lte]: data.maxPrice },
        //         ]
        //     })
        // }

        let priceFilter = [];
        if (data.minPrice) {
            // Object.assign(filter, { price: { [Op.gte]: data.minPrice } });
            priceFilter.push({ price: { [Op.gte]: data.minPrice } });
        }

        if (data.maxPrice) {
            // Object.assign(filter, { price: { [Op.lte]: data.maxPrice } });
            priceFilter.push({ price: { [Op.lte]: data.maxPrice } });
        }
        Object.assign(filter, { [Op.and]: priceFilter });

        return filter;
    }

    async createFlight(data) {
        try {
            const flight = await Flights.create(data)
            return flight;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }


    async getFlight(flightId) {
        try {
            const flight = await Flights.findByPk(flightId);
            return flight;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }

    async getAllFlight(filter) {
        try {
            const filterObj = this.#createFilter(filter);
            const flight = await Flights.findAll({
                where: filterObj
            });
            return flight;
        } catch (error) {
            console.log("Something went wrong in the repository layer");
            throw { error };
        }
    }

    async updateFlight(flightId, data) {
        try {
            await Flights.update(data, {
                where: { id: flightId }
            });

            // fetch the updated flight manually
            const updatedFlight = await Flights.findByPk(flightId);
            return updatedFlight;
        } catch (error) {
            console.log("Something went wrong in Repository layer");
            throw error;
        }
    }



}


module.exports = FlightRepository;



/*  
    {
        where: {
            arrivalAirportId: 2,
            departureAirportId: 4,
            price: {[Op.gte]: 4000}
        }
    }
*/