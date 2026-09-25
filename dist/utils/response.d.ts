import { Response } from 'express';
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    code?: string;
    details?: unknown;
}
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown;
    constructor(message: string, statusCode?: number, code?: string, details?: unknown);
}
export declare function sendSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
export declare function sendError(res: Response, message: string, statusCode?: number, code?: string, details?: unknown): Response;
