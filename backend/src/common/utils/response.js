const sendSuccess = (res, options = {}) => {
  const { statusCode = 200, message, data = null, meta = null } = options;
  return res.status(statusCode).json({
    success: true,
    ...(message !== undefined && { message }),
    data,
    meta,
  });
};

const sendError = (res, options = {}) => {
  const {
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    message = 'An unexpected error occurred',
    details = [],
    requestId = null,
  } = options;

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      requestId: requestId || '00000000-0000-0000-0000-000000000000',
      timestamp: new Date().toISOString(),
    },
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
