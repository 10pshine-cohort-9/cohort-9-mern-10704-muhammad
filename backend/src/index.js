const app = require('./app');
const env = require('./config/env');
const logger = require('./logger');

const server = app.listen(env.PORT, () => {
  logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

const handleFatalError = (type, error) => {
  logger.error({ type, err: error }, `Fatal error occurred: ${type}`);
  server.close(() => {
    process.exit(1);
  });

  // Force exit after 10s if connections fail to close
  setTimeout(() => {
    process.exit(1);
  }, 10000).unref();
};

process.on('unhandledRejection', (reason) => {
  handleFatalError('unhandledRejection', reason);
});

process.on('uncaughtException', (error) => {
  handleFatalError('uncaughtException', error);
});

module.exports = server;
