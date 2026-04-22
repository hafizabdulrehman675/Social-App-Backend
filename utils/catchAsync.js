'use strict';

// Wraps async controller functions to catch errors automatically
// Without this: every controller needs its own try/catch block
// With this: just wrap the function, errors go to global error handler

// HOW IT WORKS:
// catchAsync(fn) returns a new function (req, res, next)
// When that function runs, it calls fn(req, res, next)
// If fn throws or rejects → .catch(next) sends error to Express error handler
// Express then calls our global errorHandler middleware in middleware/errorHandler.js

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
