"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
const server = app_1.app.listen(env_1.config.port, '0.0.0.0', () => {
    logger_1.logger.info(`Global Gold Live API Server running on port ${env_1.config.port}`, {
        port: env_1.config.port,
        host: '0.0.0.0',
        env: env_1.config.env,
        healthEndpoint: `http://localhost:${env_1.config.port}/api/v1/health`,
    });
});
// Graceful Shutdown
async function handleShutdown(signal) {
    logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        logger_1.logger.info('HTTP server closed.');
        await (0, db_1.disconnectDatabase)();
        process.exit(0);
    });
    // Force exit if hanging
    setTimeout(() => {
        logger_1.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
}
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
exports.default = server;
//# sourceMappingURL=server.js.map