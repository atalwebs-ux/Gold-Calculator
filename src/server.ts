import { app } from './app';
import { config } from './config/env';
import { disconnectDatabase } from './config/db';
import { logger } from './utils/logger';

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Global Gold Live API Server running on port ${config.port}`, {
    port: config.port,
    host: '0.0.0.0',
    env: config.env,
    healthEndpoint: `http://localhost:${config.port}/api/v1/health`,
  });
});

// Graceful Shutdown
async function handleShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await disconnectDatabase();
    process.exit(0);
  });

  // Force exit if hanging
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;
