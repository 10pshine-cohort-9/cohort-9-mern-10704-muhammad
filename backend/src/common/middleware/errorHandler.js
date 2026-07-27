const logger = require('../../logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || [];

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    details = [];
  } else if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Invalid JSON body syntax';
    details = [];
  }

  if (statusCode >= 500) {
    logger.error({ err, reqId: req.id }, 'Unhandled server error');
    code = 'INTERNAL_ERROR';
    message = 'An unexpected server error occurred';
    details = [];
  } else {
    logger.warn({ code, message, statusCode, reqId: req.id }, 'Handled operational error');
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      requestId: req.id || res.getHeader('X-Request-ID') || '00000000-0000-0000-0000-000000000000',
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = errorHandler;
