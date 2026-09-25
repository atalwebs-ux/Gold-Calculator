"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.checkDatabaseConnection = checkDatabaseConnection;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
// Fallback database URL for cloud hosting where .env is omitted by git
const DEFAULT_DATABASE_URL = 'mysql://u785941294_gold_db:Goldcalculater%40123@srv671.hstgr.io:3306/u785941294_gold';
const activeDbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = activeDbUrl;
}
exports.prisma = global.prismaGlobal ||
    new client_1.PrismaClient({
        datasources: {
            db: {
                url: activeDbUrl,
            },
        },
        log: process.env.NODE_ENV === 'development'
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' },
            ]
            : [{ emit: 'stdout', level: 'error' }],
    });
if (process.env.NODE_ENV !== 'production') {
    global.prismaGlobal = exports.prisma;
}
/**
 * Checks database connectivity without throwing unhandled exceptions.
 */
async function checkDatabaseConnection() {
    const start = Date.now();
    try {
        // $queryRaw`SELECT 1` tests connectivity quickly
        await exports.prisma.$queryRaw `SELECT 1`;
        return {
            connected: true,
            latencyMs: Date.now() - start,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger_1.logger.warn('Database health check ping failed', { error: message });
        return {
            connected: false,
            error: message,
        };
    }
}
/**
 * Graceful shutdown for Prisma connection.
 */
async function disconnectDatabase() {
    try {
        await exports.prisma.$disconnect();
        logger_1.logger.info('Database connection closed cleanly.');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting database', error);
    }
}
//# sourceMappingURL=db.js.map