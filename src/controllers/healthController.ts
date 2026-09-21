import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/db';
import { config } from '../config/env';
import { sendSuccess } from '../utils/response';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const dbStatus = await checkDatabaseConnection();

  const healthData = {
    status: 'ok',
    version: '1.0.0',
    service: 'Global Gold Live API',
    environment: config.env,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      type: 'mysql',
      connected: dbStatus.connected,
      latencyMs: dbStatus.latencyMs ?? null,
      error: dbStatus.error ?? null,
    },
    goldApiProvider: {
      configured: config.goldApi.provider,
      status: 'active',
    },
    forexProvider: {
      configured: 'fastFOREX',
      status: config.fastForex.apiKey ? 'active' : 'unconfigured',
    },
  };

  sendSuccess(res, healthData, 'Global Gold Live service is operational');
}
