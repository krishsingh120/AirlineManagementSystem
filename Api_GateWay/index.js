const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const app = express();
const { createProxyMiddleware } = require("http-proxy-middleware");
const { rateLimit } = require("express-rate-limit");
const axios = require("axios");





const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 5,                   // limit each IP to 5 requests per window
    message: {
        status: 429,
        error: "Too many requests, please try again later."
    }
})



const port = 3005;

// middleware setup
app.use(morgan("combined"));  // morgan  require above all of these middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);


// Api gateWay
app.use('/bookingservice', async (req, res, next) => {
    console.log(req.headers['x-access-token']);
    try {
        const response = await axios.get('http://localhost:3000/api/v1/isAuthenticated', {
            headers: {
                'x-access-token': req.headers['x-access-token']
            }
        });
        console.log(response.data);
        if (response.data.success) {
            next();
        } else {
            return res.status(401).json({
                message: 'Unauthorised'
            })
        }
    } catch (error) {
        return res.status(401).json({
            message: 'Unauthorised'
        })
    }
})



app.use("/bookingservice", createProxyMiddleware({
    target: 'http://localhost:5050',
    changeOrigin: true,
}));


// route setup

app.get("/", (req, res) => {
    res.send("hello");
})

app.get("/home", (req, res) => {
    return res.status(200).json({
        message: "OK"
    });
})






app.listen(port, "0.0.0.0", () => {
    console.log(`Server is listening on port http://0.0.0.0:${port}`);
});
