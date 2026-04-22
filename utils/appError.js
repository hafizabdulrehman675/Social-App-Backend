'use strict';

// Custom error class that extends built-in Error
// isOperational = errors WE create intentionally (user not found, wrong password)
// Non-operational = bugs we didn't expect (programming errors, DB crashes)
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // calls Error constructor with message

    this.statusCode = statusCode;

    // status: 4xx errors = 'fail' (client's fault)
    //         5xx errors = 'error' (server's fault)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // isOperational = true means WE created this error intentionally
    // We only send details of operational errors to client
    // Unknown bugs get generic "something went wrong" message
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
