import { PrismaClient } from '@prisma/client';
declare global {
    var prismaGlobal: PrismaClient | undefined;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
/**
 * Checks database connectivity without throwing unhandled exceptions.
 */
export declare function checkDatabaseConnection(): Promise<{
    connected: boolean;
    latencyMs?: number;
    error?: string;
}>;
/**
 * Graceful shutdown for Prisma connection.
 */
export declare function disconnectDatabase(): Promise<void>;
