require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/database');
const pollerService = require('./src/services/pollerService');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  await testConnection();
  pollerService.start();

  app.listen(PORT, () => {
    logger.info(`DropAlert backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
