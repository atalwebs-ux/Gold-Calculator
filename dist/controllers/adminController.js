"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
exports.changePassword = changePassword;
exports.getDashboardStats = getDashboardStats;
exports.listUsers = listUsers;
exports.deleteUser = deleteUser;
exports.exportUsersCsv = exportUsersCsv;
exports.listAdminPosts = listAdminPosts;
exports.createAdminPoll = createAdminPoll;
exports.deleteAdminPost = deleteAdminPost;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const response_1 = require("../utils/response");
const adminAuth_1 = require("../middleware/adminAuth");
/**
 * POST /api/v1/admin/login
 * Body: { email: string; password: string }
 */
async function adminLogin(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        (0, response_1.sendError)(res, 'Email and password are required', 400, 'CREDENTIALS_REQUIRED');
        return;
    }
    const cleanEmail = email.trim().toLowerCase();
    try {
        const admin = await db_1.prisma.adminUser.findUnique({
            where: { email: cleanEmail },
        });
        if (!admin) {
            (0, response_1.sendError)(res, 'Invalid admin email or password', 401, 'INVALID_CREDENTIALS');
            return;
        }
        const isValid = await bcryptjs_1.default.compare(password, admin.passwordHash);
        if (!isValid) {
            (0, response_1.sendError)(res, 'Invalid admin email or password', 401, 'INVALID_CREDENTIALS');
            return;
        }
        // Update last login
        await db_1.prisma.adminUser.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });
        const token = (0, adminAuth_1.generateAdminToken)({
            id: admin.id,
            email: admin.email,
            role: admin.role,
        });
        (0, response_1.sendSuccess)(res, {
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: admin.role,
            },
        }, 'Admin logged in successfully');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Admin login failed';
        console.error('[ADMIN CONTROLLER] adminLogin error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'INTERNAL_ERROR');
    }
}
/**
 * POST /api/v1/admin/change-password
 * Requires AdminAuth
 * Body: { currentPassword: string; newPassword: string }
 */
async function changePassword(req, res) {
    const adminId = req.admin?.id;
    const { currentPassword, newPassword } = req.body;
    if (!adminId) {
        (0, response_1.sendError)(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
    }
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        (0, response_1.sendError)(res, 'New password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
        return;
    }
    try {
        const admin = await db_1.prisma.adminUser.findUnique({
            where: { id: adminId },
        });
        if (!admin) {
            (0, response_1.sendError)(res, 'Admin account not found', 404, 'NOT_FOUND');
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, admin.passwordHash);
        if (!isMatch) {
            (0, response_1.sendError)(res, 'Current password does not match', 400, 'CURRENT_PASSWORD_INCORRECT');
            return;
        }
        const newHash = await bcryptjs_1.default.hash(newPassword, 10);
        await db_1.prisma.adminUser.update({
            where: { id: adminId },
            data: { passwordHash: newHash },
        });
        (0, response_1.sendSuccess)(res, { updated: true }, 'Admin password changed successfully');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to change password';
        console.error('[ADMIN CONTROLLER] changePassword error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'INTERNAL_ERROR');
    }
}
/**
 * GET /api/v1/admin/stats
 * Requires AdminAuth
 */
async function getDashboardStats(_req, res) {
    try {
        const [totalUsers, totalPosts, totalPolls, totalVotes, totalReplies] = await Promise.all([
            db_1.prisma.user.count(),
            db_1.prisma.communityPost.count({ where: { type: 'POST' } }),
            db_1.prisma.poll.count(),
            db_1.prisma.pollVote.count(),
            db_1.prisma.communityReply.count(),
        ]);
        (0, response_1.sendSuccess)(res, {
            totalUsers,
            totalPosts,
            totalPolls,
            totalVotes,
            totalReplies,
        }, 'Admin statistics loaded');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to fetch admin stats';
        console.error('[ADMIN CONTROLLER] getDashboardStats error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * GET /api/v1/admin/users
 * Requires AdminAuth
 */
async function listUsers(req, res) {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : undefined;
    try {
        const users = await db_1.prisma.user.findMany({
            where: search
                ? {
                    OR: [
                        { email: { contains: search } },
                        { fullName: { contains: search } },
                    ],
                }
                : undefined,
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
            take: 200,
        });
        (0, response_1.sendSuccess)(res, { count: users.length, users }, 'Users list loaded');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to list users';
        console.error('[ADMIN CONTROLLER] listUsers error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * DELETE /api/v1/admin/users/:id
 * Requires AdminAuth
 */
async function deleteUser(req, res) {
    const { id } = req.params;
    try {
        const existing = await db_1.prisma.user.findUnique({ where: { id } });
        if (!existing) {
            (0, response_1.sendError)(res, 'User not found in database', 404, 'NOT_FOUND');
            return;
        }
        await db_1.prisma.user.delete({ where: { id } });
        (0, response_1.sendSuccess)(res, { id, email: existing.email }, 'User successfully deleted');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to delete user';
        console.error('[ADMIN CONTROLLER] deleteUser error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * GET /api/v1/admin/users/export
 * Requires AdminAuth
 * Exports users data directly as CSV
 */
async function exportUsersCsv(_req, res) {
    try {
        const users = await db_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const headers = [
            'ID',
            'Email',
            'Full Name',
            'Auth Provider',
            'Email Verified',
            'Role',
            'Status',
            'Last Login',
            'Registered Date',
        ];
        const escapeCsv = (str) => {
            if (!str)
                return '""';
            const clean = String(str).replace(/"/g, '""');
            return `"${clean}"`;
        };
        const rows = users.map((u) => [
            escapeCsv(u.id),
            escapeCsv(u.email),
            escapeCsv(u.fullName),
            escapeCsv(u.authProvider),
            u.emailVerified ? 'Yes' : 'No',
            escapeCsv(u.role),
            escapeCsv(u.status),
            escapeCsv(u.lastLoginAt ? u.lastLoginAt.toISOString() : ''),
            escapeCsv(u.createdAt.toISOString()),
        ]);
        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
        const fileName = `gold_live_users_${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.status(200).send(csvContent);
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to export users CSV';
        console.error('[ADMIN CONTROLLER] exportUsersCsv error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * GET /api/v1/admin/posts
 * Requires AdminAuth
 */
async function listAdminPosts(_req, res) {
    try {
        const posts = await db_1.prisma.communityPost.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                poll: {
                    include: {
                        options: { orderBy: { orderIndex: 'asc' } },
                    },
                },
            },
        });
        (0, response_1.sendSuccess)(res, { count: posts.length, posts }, 'All posts retrieved');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to list posts';
        console.error('[ADMIN CONTROLLER] listAdminPosts error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * POST /api/v1/admin/poll
 * Requires AdminAuth
 * Body: { question: string; options: string[]; tag?: string }
 */
async function createAdminPoll(req, res) {
    const { question, options, tag = 'Market Forecast' } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
        (0, response_1.sendError)(res, 'Poll question is required', 400, 'QUESTION_REQUIRED');
        return;
    }
    const validOptions = Array.isArray(options)
        ? options.map((opt) => String(opt).trim()).filter((opt) => opt.length > 0)
        : [];
    if (validOptions.length < 2) {
        (0, response_1.sendError)(res, 'Poll must have at least 2 options', 400, 'INVALID_OPTIONS');
        return;
    }
    try {
        const post = await db_1.prisma.communityPost.create({
            data: {
                authorName: 'Gold Live Admin',
                authorRole: 'Official Poll',
                content: question.trim(),
                type: 'POLL',
                tag,
                isAdminPost: true,
                poll: {
                    create: {
                        question: question.trim(),
                        totalVotes: 0,
                        options: {
                            create: validOptions.map((text, idx) => ({
                                text,
                                orderIndex: idx,
                                votesCount: 0,
                            })),
                        },
                    },
                },
            },
            include: {
                poll: {
                    include: {
                        options: { orderBy: { orderIndex: 'asc' } },
                    },
                },
            },
        });
        (0, response_1.sendSuccess)(res, post, 'Official admin poll published successfully', 201);
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to create admin poll';
        console.error('[ADMIN CONTROLLER] createAdminPoll error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
/**
 * DELETE /api/v1/admin/posts/:id
 * Requires AdminAuth
 */
async function deleteAdminPost(req, res) {
    const { id } = req.params;
    try {
        const post = await db_1.prisma.communityPost.findUnique({ where: { id } });
        if (!post) {
            (0, response_1.sendError)(res, 'Post not found', 404, 'NOT_FOUND');
            return;
        }
        await db_1.prisma.communityPost.delete({ where: { id } });
        (0, response_1.sendSuccess)(res, { id }, 'Post/poll permanently removed by Admin');
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to delete post';
        console.error('[ADMIN CONTROLLER] deleteAdminPost error:', err);
        (0, response_1.sendError)(res, errMsg, 500, 'DATABASE_ERROR');
    }
}
//# sourceMappingURL=adminController.js.map