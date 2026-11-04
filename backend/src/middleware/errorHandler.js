import logger from '../utils/logger.js';

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler — every thrown error ends up here (Express 5 forwards async errors automatically)
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server.';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = details[0] || 'Validation failed.';
  } else if (err.name === 'CastError') {
    status = 400;
    message = err.path === '_id' ? 'Invalid ID.' : `Invalid value for ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `This ${field} is already in use.`;
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Your session is invalid. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session has expired. Please log in again.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${err.stack || err.message}`);
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong on the server.';
  }

  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
};
