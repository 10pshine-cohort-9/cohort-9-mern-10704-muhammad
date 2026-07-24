const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
  transport:
    process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

module.exports = logger;
