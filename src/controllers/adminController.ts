import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';
import { AdminAuthRequest, generateAdminToken } from '../middleware/adminAuth';

/**
 * POST /api/v1/admin/login
 * Body: { email: string; password: string }
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    sendError(res, 'Email and password are required', 400, 'CREDENTIALS_REQUIRED');
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      sendError(res, 'Invalid admin email or password', 401, 'INVALID_CREDENTIALS');
      return;
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      sendError(res, 'Invalid admin email or password', 401, 'INVALID_CREDENTIALS');
      return;
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    sendSuccess(
      res,
      {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
      'Admin logged in successfully'
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Admin login failed';
    console.error('[ADMIN CONTROLLER] adminLogin error:', err);
    sendError(res, errMsg, 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/v1/admin/change-password
 * Requires AdminAuth
 * Body: { currentPassword: string; newPassword: string }
 */
export async function changePassword(req: AdminAuthRequest, res: Response): Promise<void> {
  const adminId = req.admin?.id;
  const { currentPassword, newPassword } = req.body;

  if (!adminId) {
    sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    return;
  }

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    sendError(res, 'New password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
    return;
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      sendError(res, 'Admin account not found', 404, 'NOT_FOUND');
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      sendError(res, 'Current password does not match', 400, 'CURRENT_PASSWORD_INCORRECT');
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { passwordHash: newHash },
    });

    sendSuccess(res, { updated: true }, 'Admin password changed successfully');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to change password';
    console.error('[ADMIN CONTROLLER] changePassword error:', err);
    sendError(res, errMsg, 500, 'INTERNAL_ERROR');
  }
}

/**
 * GET /api/v1/admin/stats
 * Requires AdminAuth
 */
export async function getDashboardStats(_req: AdminAuthRequest, res: Response): Promise<void> {
  try {
    const [totalUsers, totalPosts, totalPolls, totalVotes, totalReplies] = await Promise.all([
      prisma.user.count(),
      prisma.communityPost.count({ where: { type: 'POST' } }),
      prisma.poll.count(),
      prisma.pollVote.count(),
      prisma.communityReply.count(),
    ]);

    sendSuccess(
      res,
      {
        totalUsers,
        totalPosts,
        totalPolls,
        totalVotes,
        totalReplies,
      },
      'Admin statistics loaded'
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch admin stats';
    console.error('[ADMIN CONTROLLER] getDashboardStats error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * GET /api/v1/admin/users
 * Requires AdminAuth
 */
export async function listUsers(req: AdminAuthRequest, res: Response): Promise<void> {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : undefined;

  try {
    const users = await prisma.user.findMany({
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

    sendSuccess(res, { count: users.length, users }, 'Users list loaded');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to list users';
    console.error('[ADMIN CONTROLLER] listUsers error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * DELETE /api/v1/admin/users/:id
 * Requires AdminAuth
 */
export async function deleteUser(req: AdminAuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      sendError(res, 'User not found in database', 404, 'NOT_FOUND');
      return;
    }

    await prisma.user.delete({ where: { id } });
    sendSuccess(res, { id, email: existing.email }, 'User successfully deleted');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to delete user';
    console.error('[ADMIN CONTROLLER] deleteUser error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * GET /api/v1/admin/users/export
 * Requires AdminAuth
 * Exports users data directly as CSV
 */
export async function exportUsersCsv(_req: AdminAuthRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
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

    const escapeCsv = (str: string | null | undefined): string => {
      if (!str) return '""';
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
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to export users CSV';
    console.error('[ADMIN CONTROLLER] exportUsersCsv error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * GET /api/v1/admin/posts
 * Requires AdminAuth
 */
export async function listAdminPosts(_req: AdminAuthRequest, res: Response): Promise<void> {
  try {
    const posts = await prisma.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        poll: {
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    sendSuccess(res, { count: posts.length, posts }, 'All posts retrieved');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to list posts';
    console.error('[ADMIN CONTROLLER] listAdminPosts error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * POST /api/v1/admin/poll
 * Requires AdminAuth
 * Body: { question: string; options: string[]; tag?: string }
 */
export async function createAdminPoll(req: AdminAuthRequest, res: Response): Promise<void> {
  const { question, options, tag = 'Market Forecast' } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    sendError(res, 'Poll question is required', 400, 'QUESTION_REQUIRED');
    return;
  }

  const validOptions = Array.isArray(options)
    ? options.map((opt) => String(opt).trim()).filter((opt) => opt.length > 0)
    : [];

  if (validOptions.length < 2) {
    sendError(res, 'Poll must have at least 2 options', 400, 'INVALID_OPTIONS');
    return;
  }

  try {
    const post = await prisma.communityPost.create({
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

    sendSuccess(res, post, 'Official admin poll published successfully', 201);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to create admin poll';
    console.error('[ADMIN CONTROLLER] createAdminPoll error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * DELETE /api/v1/admin/posts/:id
 * Requires AdminAuth
 */
export async function deleteAdminPost(req: AdminAuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      sendError(res, 'Post not found', 404, 'NOT_FOUND');
      return;
    }

    await prisma.communityPost.delete({ where: { id } });
    sendSuccess(res, { id }, 'Post/poll permanently removed by Admin');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to delete post';
    console.error('[ADMIN CONTROLLER] deleteAdminPost error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}
