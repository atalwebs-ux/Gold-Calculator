import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Fallback database URL for cloud hosting where .env is omitted by git
const DEFAULT_DATABASE_URL =
  'mysql://u785941294_gold_db:Goldcalculater%40123@srv671.hstgr.io:3306/u785941294_gold';

const activeDbUrl = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = activeDbUrl;
}

// PrismaClient singleton pattern
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

/**
 * Checks database connectivity without throwing unhandled exceptions.
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    // $queryRaw`SELECT 1` tests connectivity quickly
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn('Database health check ping failed', { error: message });
    return {
      connected: false,
      error: message,
    };
  }
}

/**
 * Graceful shutdown for Prisma connection.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed cleanly.');
  } catch (error) {
    logger.error('Error disconnecting database', error);
  }
}
