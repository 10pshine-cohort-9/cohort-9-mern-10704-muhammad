const rateLimit = require('express-rate-limit');
const env = require('../../config/env');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts, please try again later.',
        details: [],
        timestamp: new Date().toISOString(),
      },
    });
  },
});

module.exports = { authRateLimiter };
