const { StatusCodes } = require("http-status-codes");

class AppError extends Error {
    constructor(
        name = 'AppError',
        message = 'Something went wrong',
        explanation = 'Something went wrong',
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR
    ) {
        super(message); // initialize Error with the message
        this.name = name;
        this.explanation = explanation;
        this.statusCode = statusCode;

        // // Maintains proper stack trace (only in V8 engines like Node.js)
        // if (Error.captureStackTrace) {
        //     Error.captureStackTrace(this, this.constructor);
        // }
    }
}

module.exports = AppError;
