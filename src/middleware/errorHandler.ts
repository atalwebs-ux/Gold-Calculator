import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      code: err.code,
    });
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error('Unhandled Exception occurred', errorObj, {
    path: req.path,
    method: req.method,
  });

  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred'
      : errorObj.message;

  sendError(res, message, 500, 'INTERNAL_SERVER_ERROR', null);
}
