const logger = require('../config/logger');

function errorHandler(err, req, res, _next) {
  // Validation errors from express-validator are handled in controllers;
  // this handles unexpected throws.
  logger.error(`[${req.method} ${req.path}]`, err);

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
