const  AppError  = require("./error.handler");
const { StatusCodes } = require("http-status-codes");


class ValidationError extends AppError {

    constructor(error) {

        let errorName = error.name || 'ValidationError';
        let explanation = [];

        error.errors.forEach((err) => {
            explanation.push(err.message)
        });


        super(
            errorName,
            'Not able to validate the data sent in request',
            explanation,
            StatusCodes.BAD_REQUEST
        )
    }
}

module.exports = ValidationError;