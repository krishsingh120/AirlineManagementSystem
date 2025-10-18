const express = require("express");
const app = express();
const { PORT } = require("./config/server.config");
const bodyParser = require("body-parser");
const apiRoute = require("./routes/index");
const port = PORT;

const db = require("./models/index");





const prepareAndStartServer = () => {
    // middlewares
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));


    // Routes -> /api/v1/user
    app.use('/api', apiRoute);


    app.get('/', (req, res) => {
        res.send("hello");
    });



    app.listen(port, async () => {
        console.log(`Server is listening on port http://localhost:${port}`);
        if (process.env.DB_SYNC) {
            db.sequelize.sync({ alert: true });
        }




    });
}


prepareAndStartServer();