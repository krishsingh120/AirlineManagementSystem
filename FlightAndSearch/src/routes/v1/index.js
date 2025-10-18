const express = require("express");
const {
    CityController,
    FlightController,
    AirportController,
} = require("../../controllers/index");
const { FlightMiddlewares } = require("../../middleware/index")
const router = express.Router();


// routes => /api/v1/city
router.post("/city", CityController.create);
router.post("/city/bulk-create", CityController.Bulkcreate);
router.delete("/city/:id", CityController.remove);
router.get("/city/:id", CityController.get);
router.get("/city", CityController.getall);
router.patch("/city/:id", CityController.update);



// flight routes
router.post('/flights', FlightMiddlewares.validateCreateFlight, FlightController.create);
router.get('/flights/:id', FlightController.get);
router.get('/flights', FlightController.getAll);
router.patch('/flights/:id', FlightController.update)


// Aiport routes
router.post("/airport", AirportController.create);



module.exports = router;


