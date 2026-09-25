import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'gold-admin-secret-key-2026';

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

export function requireAdminAuth(req: AdminAuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token missing or invalid', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.admin = decoded;
    next();
  } catch (err) {
    sendError(res, 'Invalid or expired session token', 401, 'INVALID_TOKEN');
  }
}

export function generateAdminToken(admin: { id: string; email: string; role: string }): string {
  return jwt.sign(admin, JWT_SECRET, { expiresIn: '7d' });
}
