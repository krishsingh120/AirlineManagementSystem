const bcrypt = require("bcrypt")
require("dotenv").config({ path: "./.env" })

module.exports = {
    PORT: process.env.PORT || 8080,
    SALT: bcrypt.genSaltSync(10),
    JWT_KEY: process.env.JWT_KEY,
}