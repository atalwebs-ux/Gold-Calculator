import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import { sendError } from './utils/response';

export function createApp(): Application {
  const app = express();

  // Security Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
      credentials: true,
    })
  );

  // Body Parsing Middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Logging Middleware
  app.use(requestLogger);

  // Root Info Route
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Global Gold Live API',
      version: '1.0.0',
      status: 'active',
      documentation: '/api/v1/health',
    });
  });

  // API v1 Base Route
  app.use('/api/v1', apiRoutes);

  // Catch 404
  app.use((req: Request, res: Response) => {
    sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
