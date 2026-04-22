'use strict';

const AppError = require('../utils/appError');

// ─── Sequelize-Specific Error Handlers ───────────────────────────────────────
// Natours used MongoDB/Mongoose errors — we adapted these for Sequelize/PostgreSQL

// Sequelize validation failed (e.g. allowNull: false violated)
// Frontend gets: "username cannot be empty"
const handleValidationError = (err) => {
  const messages = err.errors.map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join(', ')}`, 400);
};

// Sequelize unique constraint violated (duplicate email/username)
// Frontend gets: "email already exists"
const handleUniqueConstraintError = (err) => {
  const field = err.errors[0]?.path || 'field';
  return new AppError(`${field} already exists. Please use another value.`, 400);
};

// Sequelize foreign key violation (referencing non-existent record)
const handleForeignKeyError = () =>
  new AppError('Referenced record does not exist.', 400);

// Sequelize database connection or query error
const handleDatabaseError = () =>
  new AppError('Database error occurred. Please try again.', 500);

// JWT token is invalid or tampered
// Frontend: redirect to login
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

// JWT token has expired
// Frontend: redirect to login
const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

// ─── Send Error in Development ────────────────────────────────────────────────
// Development: send FULL error details (stack trace, all info)
// Useful for debugging — never expose this in production
const sendErrorDevelopment = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack, // full stack trace for debugging
  });
};

// ─── Send Error in Production ─────────────────────────────────────────────────
// Production: only send safe info to client
// isOperational = our known errors → send specific message
// Unknown errors → send generic message (don't leak server details)
const sendErrorProduction = (err, res) => {
  if (err.isOperational) {
    // Our intentional error — safe to show client
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Unknown bug — log it but don't expose details
    console.error('UNEXPECTED ERROR:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ─── Global Error Handler Middleware ─────────────────────────────────────────
// Express recognizes this as error handler because it has 4 params (err, req, res, next)
// Any error passed to next(err) anywhere in app lands here
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDevelopment(err, res);
  } else {
    let error = Object.create(err);

    // Sequelize error types → convert to AppError
    if (err.name === 'SequelizeValidationError')        error = handleValidationError(err);
    if (err.name === 'SequelizeUniqueConstraintError')  error = handleUniqueConstraintError(err);
    if (err.name === 'SequelizeForeignKeyConstraintError') error = handleForeignKeyError();
    if (err.name === 'SequelizeDatabaseError')          error = handleDatabaseError();

    // JWT error types
    if (err.name === 'JsonWebTokenError')  error = handleJWTError();
    if (err.name === 'TokenExpiredError')  error = handleJWTExpiredError();

    sendErrorProduction(error, res);
  }
};
