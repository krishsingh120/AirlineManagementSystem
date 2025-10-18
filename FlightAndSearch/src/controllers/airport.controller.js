const { AirportService } = require("../services/index");

const airportService = new AirportService();

const create = async (req, res) => {
    try {
        const result = await airportService.create(req.body);
        return res.status(201).json({
            data: result,
            success: true,
            mesaage: "Airport created successfully",
            err: {}
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            mesaage: "Not able to create airport",
            err: error ,
        })
    }
}



module.exports = {
    create,
}