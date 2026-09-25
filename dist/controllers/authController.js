"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
exports.resendOtp = resendOtp;
exports.syncCustomer = syncCustomer;
exports.getCustomer = getCustomer;
exports.listCustomers = listCustomers;
const otpService_1 = require("../services/otpService");
const response_1 = require("../utils/response");
const db_1 = require("../config/db");
/**
 * POST /api/v1/auth/send-otp
 * Body: { email: string, name?: string }
 */
async function sendOtp(req, res) {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        (0, response_1.sendError)(res, 'A valid email address is required', 400, 'INVALID_EMAIL');
        return;
    }
    try {
        const result = await (0, otpService_1.generateAndSendOtp)(email, name);
        if (!result.success) {
            const statusCode = result.cooldownRemaining ? 429 : 400;
            const code = result.cooldownRemaining ? 'COOLDOWN_ACTIVE' : 'OTP_SEND_FAILED';
            (0, response_1.sendError)(res, result.message, statusCode, code, {
                cooldownRemaining: result.cooldownRemaining,
            });
            return;
        }
        (0, response_1.sendSuccess)(res, {
            email: email.trim().toLowerCase(),
            devOtp: result.devOtp, // Only present in non-production
        }, result.message);
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to send OTP';
        console.error('[AUTH CONTROLLER] sendOtp error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'INTERNAL_ERROR');
    }
}
/**
 * POST /api/v1/auth/verify-otp
 * Body: { email: string, otp: string }
 */
async function verifyOtp(req, res) {
    const { email, otp } = req.body;
    if (!email || typeof email !== 'string') {
        (0, response_1.sendError)(res, 'Email is required', 400, 'EMAIL_REQUIRED');
        return;
    }
    if (!otp || typeof otp !== 'string') {
        (0, response_1.sendError)(res, 'Verification code is required', 400, 'OTP_REQUIRED');
        return;
    }
    try {
        const result = (0, otpService_1.verifyOtp)(email, otp);
        if (!result.success) {
            (0, response_1.sendError)(res, result.message, 400, result.error || 'VERIFY_FAILED');
            return;
        }
        (0, response_1.sendSuccess)(res, {
            verified: true,
            email: email.trim().toLowerCase(),
        }, result.message);
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to verify OTP';
        console.error('[AUTH CONTROLLER] verifyOtp error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'INTERNAL_ERROR');
    }
}
/**
 * POST /api/v1/auth/resend-otp
 * Body: { email: string }
 */
async function resendOtp(req, res) {
    return sendOtp(req, res);
}
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
async function syncCustomer(req, res) {
    const { firebaseUid, email, fullName, profileImageUrl, authProvider, emailVerified } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        (0, response_1.sendError)(res, 'Valid email is required', 400, 'INVALID_EMAIL');
        return;
    }
    if (!firebaseUid || typeof firebaseUid !== 'string') {
        (0, response_1.sendError)(res, 'Firebase UID is required', 400, 'UID_REQUIRED');
        return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const provider = authProvider || 'password';
    try {
        const user = await db_1.prisma.user.upsert({
            where: { email: cleanEmail },
            update: {
                firebaseUid,
                ...(fullName ? { fullName } : {}),
                ...(profileImageUrl ? { profileImageUrl } : {}),
                authProvider: provider,
                emailVerified: emailVerified ?? true,
                lastLoginAt: new Date(),
            },
            create: {
                firebaseUid,
                email: cleanEmail,
                fullName: fullName || null,
                profileImageUrl: profileImageUrl || null,
                authProvider: provider,
                emailVerified: emailVerified ?? true,
                lastLoginAt: new Date(),
                preference: {
                    create: {
                        defaultCountryCode: 'IN',
                        defaultCurrencyCode: 'INR',
                        defaultPurity: '22K',
                        defaultWeightUnit: 'gram',
                        theme: 'system',
                        notificationsEnabled: true,
                    },
                },
            },
            include: {
                preference: true,
            },
        });
        // Record audit log entry
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            'unknown';
        await db_1.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: provider === 'google.com' ? 'GOOGLE_LOGIN' : 'CUSTOMER_LOGIN',
                entityType: 'User',
                entityId: user.id,
                ipAddress: clientIp,
                metadata: JSON.stringify({
                    email: user.email,
                    provider,
                    fullName: user.fullName,
                }),
            },
        }).catch((auditErr) => {
            console.warn('[AUTH] AuditLog creation notice:', auditErr?.message);
        });
        (0, response_1.sendSuccess)(res, {
            id: user.id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            fullName: user.fullName,
            profileImageUrl: user.profileImageUrl,
            authProvider: user.authProvider,
            emailVerified: user.emailVerified,
            role: user.role,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            preference: user.preference,
        }, 'Customer profile successfully saved to database');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to sync customer profile';
        console.error('[AUTH CONTROLLER] syncCustomer error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * GET /api/v1/auth/customer?email=... or ?uid=...
 * Fetch customer profile from database.
 */
async function getCustomer(req, res) {
    const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : undefined;
    const uid = typeof req.query.uid === 'string' ? req.query.uid.trim() : undefined;
    if (!email && !uid) {
        (0, response_1.sendError)(res, 'Email or UID query parameter is required', 400, 'PARAM_REQUIRED');
        return;
    }
    try {
        const user = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    ...(email ? [{ email }] : []),
                    ...(uid ? [{ firebaseUid: uid }] : []),
                ],
            },
            include: {
                preference: true,
            },
        });
        if (!user) {
            (0, response_1.sendError)(res, 'Customer not found in database', 404, 'NOT_FOUND');
            return;
        }
        (0, response_1.sendSuccess)(res, user, 'Customer found');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to fetch customer';
        console.error('[AUTH CONTROLLER] getCustomer error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * GET /api/v1/auth/customers
 * Returns all saved customers in database (up to 100).
 */
async function listCustomers(_req, res) {
    try {
        const users = await db_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                firebaseUid: true,
                email: true,
                fullName: true,
                profileImageUrl: true,
                authProvider: true,
                emailVerified: true,
                role: true,
                status: true,
                lastLoginAt: true,
                createdAt: true,
            },
            take: 100,
        });
        (0, response_1.sendSuccess)(res, { count: users.length, customers: users }, 'Customer list retrieved');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to list customers';
        console.error('[AUTH CONTROLLER] listCustomers error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
//# sourceMappingURL=authController.js.map