const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ApiRoutes = require("./routes/index");
const { PORT } = require("./config/server.config");
const { msgServiceCall } = require("./utils/index");
const jobs = require("./utils/job");


const port = PORT || 3000;

const setupAndStartServer = async () => {
    try {

        // middleware setup
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

      
        // route setup
        app.get('/', (req, res) => {
            res.send("hello");
        })

        // global Api setup
        app.use("/api", ApiRoutes);


        // msg service function call
        msgServiceCall();


        app.listen(port, () => {
            console.log(`Server is listening on port http://localhost:${port}`);

            // sendBasicMail(
            //     "vani143@gmail.com",
            //     "krishsin2254@gmail.com",
            //     "My vani letter.",
            //     "this letter is very deeply close to my heart."
            // )




            // jobs();




            // cron.schedule('*/5 * * * * *', () => {
            //     console.log('running a task every 5 sec');
            // });
        })




    } catch (error) {
        console.log("Error during server starting");
        throw error;
    }
}

setupAndStartServer()