const { CityService } = require("../services/index");

const cityService = new CityService();

/* 
   POST
   data-> req.body
*/
const create = async (req, res) => {
    try {
        const city = await cityService.createCity(req.body);
        return res.status(201).json({
            data: city,
            success: true,
            message: "Successfully created a city",
            err: {},
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Not able to create a city",
            err: error
        })
    }
}

// POST. /city/
const Bulkcreate = async (req, res) => {
    try {
        // console.log(req.body);
        
        const cities = await cityService.createCities(req.body);
        return res.status(201).json({
            data: cities,
            success: true,
            message: "Successfully created a cities",
            err: {},
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Not able to create a city",
            err: error
        })
    }
}

// DELET -> /city/:id -> req.params
const remove = async (req, res) => {
    try {
        const response = await cityService.deleteCity(req.params.id);
        return res.status(200).json({
            data: response,
            success: true,
            message: "Successfully deleted the city",
            err: {},
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Not able to delete a city",
            err: error
        })
    }
}


// GET -> /city/:id
const get = async (req, res) => {
    try {
        const city = await cityService.getCity(req.params.id);
        return res.status(200).json({
            data: city,
            success: true,
            message: "Successfully fetched the city",
            err: {},
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Not able to fetch a city",
            err: error
        })
    }
}


// PATCH -> /city/:id
const update = async (req, res) => {
    try {
        const response = await cityService.updateCity(req.params.id, req.body);
        return res.status(200).json({
            data: response,
            success: true,
            message: "Successfully update the city",
            err: {},
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Not able to update a city",
            err: error
        })
    }
}

// GET. /city
const getall = async (req, res) => {
    try {
        console.log(req.query);
        
        const cities = await cityService.getallcities(req.query);
        return res.status(200).json({
            data: cities,
            success: true,
            message: "Successfully fetch the cities",
            err: {},
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            data: {},
            success: false,
            message: "Not able to fetch the cities",
            err: error
        })
    }
}

module.exports = {
    create, Bulkcreate, remove, get, update, getall
}