import { Request, Response } from 'express';
import { AdminAuthRequest } from '../middleware/adminAuth';
/**
 * POST /api/v1/admin/login
 * Body: { email: string; password: string }
 */
export declare function adminLogin(req: Request, res: Response): Promise<void>;
/**
 * POST /api/v1/admin/change-password
 * Requires AdminAuth
 * Body: { currentPassword: string; newPassword: string }
 */
export declare function changePassword(req: AdminAuthRequest, res: Response): Promise<void>;
/**
 * GET /api/v1/admin/stats
 * Requires AdminAuth
 */
export declare function getDashboardStats(_req: AdminAuthRequest, res: Response): Promise<void>;
/**
 * GET /api/v1/admin/users
 * Requires AdminAuth
 */
export declare function listUsers(req: AdminAuthRequest, res: Response): Promise<void>;
/**
 * DELETE /api/v1/admin/users/:id
 * Requires AdminAuth
 */
export declare function deleteUser(req: AdminAuthRequest, res: Response): Promise<void>;
/**
 * GET /api/v1/admin/users/export
 * Requires AdminAuth
 * Exports users data directly as CSV
 */
export declare function exportUsersCsv(_req: AdminAuthRequest, res: Response): Promise<void>;
/**
 * GET /api/v1/admin/posts
 * Requires AdminAuth
 */
export declare function listAdminPosts(_req: AdminAuthRequest, res: Response): Promise<void>;
/**
 * POST /api/v1/admin/poll
 * Requires AdminAuth
 * Body: { question: string; options: string[]; tag?: string }
 */
export declare function createAdminPoll(req: AdminAuthRequest, res: Response): Promise<void>;
/**
 * DELETE /api/v1/admin/posts/:id
 * Requires AdminAuth
 */
export declare function deleteAdminPost(req: AdminAuthRequest, res: Response): Promise<void>;
