const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { PORT } = require("./config/serverConfig");
const morgan = require("morgan");
const apiRoutes = require("./routes/index");
require('dotenv').config({ path: "./.env" })


const db = require("./models/index");


const port = PORT;

const setUpApplicationServer = () => {
    try {

        // middlewares 
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        // app.use(morgan());


        // Routes /api/v1/users
        // app.get('/api/v1/home', (req, res) => {
        //     return res.status(200).json({
        //         message: "Hitting booking service",
        //     });
        // });

        app.use('/api', apiRoutes);


        app.listen(port, () => {
            console.log(`Server is listening on port http://localhost:${port}`);

            if (process.env.DB_SYNC === 'true') {
                db.sequelize.sync({ alter: true });
            }
        })





    } catch (error) {

    }
}


setUpApplicationServer();