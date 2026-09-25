import { Request, Response } from 'express';
/**
 * POST /api/v1/auth/send-otp
 * Body: { email: string, name?: string }
 */
export declare function sendOtp(req: Request, res: Response): Promise<void>;
/**
 * POST /api/v1/auth/verify-otp
 * Body: { email: string, otp: string }
 */
export declare function verifyOtp(req: Request, res: Response): Promise<void>;
/**
 * POST /api/v1/auth/resend-otp
 * Body: { email: string }
 */
export declare function resendOtp(req: Request, res: Response): Promise<void>;
/**
 * POST /api/v1/auth/sync-user
 * Saves or updates logged-in / registered customer data in MySQL database.
 * Body: {
 *   firebaseUid: string;
 *   email: string;
 *   fullName?: string;
 *   profileImageUrl?: string;
 *   authProvider?: string;
 *   emailVerified?: boolean;
 * }
 */
export declare function syncCustomer(req: Request, res: Response): Promise<void>;
/**
 * GET /api/v1/auth/customer?email=... or ?uid=...
 * Fetch customer profile from database.
 */
export declare function getCustomer(req: Request, res: Response): Promise<void>;
/**
 * GET /api/v1/auth/customers
 * Returns all saved customers in database (up to 100).
 */
export declare function listCustomers(_req: Request, res: Response): Promise<void>;
