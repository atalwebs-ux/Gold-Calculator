import { Request, Response, NextFunction } from 'express';
export interface AdminAuthRequest extends Request {
    admin?: {
        id: string;
        email: string;
        role: string;
    };
}
export declare function requireAdminAuth(req: AdminAuthRequest, res: Response, next: NextFunction): void;
export declare function generateAdminToken(admin: {
    id: string;
    email: string;
    role: string;
}): string;
