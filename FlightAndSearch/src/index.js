const express = require("express");
const { PORT } = require("./config/serverConfig");
const { City, Airport, Airplane } = require("./models/index")
const sequelize = require("sequelize");
const db = require("./models/index")
const bodyParser = require("body-parser");
const ApiRoutes = require("./routes/index");
const { Op } = require("sequelize");

const port = PORT || 8080;

const setupAndStartServer = async () => {
    const app = express();

    // middleware setup
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));


    // Routes. /api/v1/city
    app.use("/api", ApiRoutes);


    app.get("/", (req, res) => {
        res.send("hello");
    })

    app.listen(port, async () => {
        console.log(`Server is listening http://localhost:${port}`);

        if (process.env.SYNC_DB) {
            db.sequelize.sync({ alter: true });
        }

        // await Airplane.destroy({
        //     where: {
        //         id: 9,
        //     }
            
        // })

        // const city = await City.findAll({
        //     where: {
        //         id: 98
        //     },
        //     include: [{
        //         model: Airport
        //     }]
        // });
        // console.log(city);

        // after sync find all the airports, as object form not in array form.

        // const city = await City.findOne({
        //     where: {
        //         id: 98
        //     }
        // })
        // const airports = await city.getAirports();  // join query
        // const newAirport = await Airport.findOne({
        //     where: {
        //         id: 98
        //     }
        // })

        // await city.addAirports(newAirport);




    })
}

setupAndStartServer()
