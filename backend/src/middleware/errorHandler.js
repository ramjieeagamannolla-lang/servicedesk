const ApiError = require('../utils/ApiError');

// 404 handler for unmatched routes — placed after all routes in server.js.
function notFound(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler. Converts known error shapes (Mongoose validation,
// duplicate key, cast errors, our own ApiError) into consistent JSON, and
// never leaks stack traces outside development.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  if (err.name === 'ValidationError') {
    statusCode = 422;
    details = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `A record with this ${field} already exists` : 'Duplicate record';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  const body = {
    success: false,
    message,
  };
  if (details) body.details = details;
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = { notFound, errorHandler };
