const app = require('./app');
const env = require('./config/env');
const logger = require('./logger');

const server = app.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

let isShuttingDown = false;

const shutdown = (signal, error = null, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (error) {
    logger.error({ signal, err: error }, `Fatal error occurred: ${signal}`);
  } else {
    logger.info({ signal }, `Received ${signal}. Shutting down gracefully...`);
  }

  server.close(() => {
    process.exit(exitCode);
  });

  setTimeout(() => {
    process.exit(exitCode);
  }, 10000).unref();
};

process.on('unhandledRejection', (reason) => shutdown('unhandledRejection', reason, 1));
process.on('uncaughtException', (error) => shutdown('uncaughtException', error, 1));
process.on('SIGTERM', () => shutdown('SIGTERM', null, 0));
process.on('SIGINT', () => shutdown('SIGINT', null, 0));

module.exports = server;
