import app from './app.js';
import { connectDatabase, sequelize } from './config/database.js';
import { env } from './config/env.js';
import './models/index.js';
import { urlCache } from './services/cacheService.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDatabase();
  sequelize.sync({alter: true})

  const server = app.listen(env.port, () => {
    logger.info(`Server running on ${env.baseUrl} (${env.nodeEnv})`);
  });

  // Remove expired cache entries once a minute. unref() lets the process exit normally.
  const pruneTimer = setInterval(() => urlCache.prune(), 60_000);
  pruneTimer.unref();

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    clearInterval(pruneTimer);
    server.close(async () => {
      await sequelize.close();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    // Force exit if connections refuse to close.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.stack : String(reason) });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.stack });
  process.exit(1);
});

start().catch((error) => {
  logger.error('Failed to start the server', { error: error.stack });
  process.exit(1);
});
