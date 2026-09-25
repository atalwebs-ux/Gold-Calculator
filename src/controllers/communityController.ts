import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { sendSuccess, sendError } from '../utils/response';

/**
 * GET /api/v1/community/posts
 * Query: ?userId=... & ?tag=...
 */
export async function getPosts(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === 'string' ? req.query.userId.trim() : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : undefined;
  const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
  const limit = limitParam && !isNaN(limitParam) && limitParam > 0 ? limitParam : undefined;

  try {
    const posts = await prisma.communityPost.findMany({
      where: {
        ...(tag && tag !== 'All' ? { tag } : {}),
      },
      orderBy: [
        { isAdminPost: 'desc' },
        { createdAt: 'desc' },
      ],
      ...(limit ? { take: limit } : {}),
      include: {
        poll: {
          include: {
            options: {
              orderBy: { orderIndex: 'asc' },
            },
            ...(userId
              ? {
                  votes: {
                    where: { userId },
                    select: { optionId: true },
                  },
                }
              : {}),
          },
        },
        ...(userId
          ? {
              likes: {
                where: { userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    const formattedPosts = posts.map((post) => {
      const userLiked = userId ? (post.likes && post.likes.length > 0) : false;
      const userVotedOptionId =
        userId && post.poll && post.poll.votes && post.poll.votes.length > 0
          ? post.poll.votes[0].optionId
          : null;

      return {
        id: post.id,
        userId: post.userId,
        authorName: post.authorName,
        authorRole: post.authorRole,
        authorAvatar: post.authorAvatar,
        content: post.content,
        type: post.type,
        tag: post.tag,
        isAdminPost: post.isAdminPost,
        likesCount: post.likesCount,
        repliesCount: post.repliesCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        userLiked,
        poll: post.poll
          ? {
              id: post.poll.id,
              question: post.poll.question,
              totalVotes: post.poll.totalVotes,
              expiresAt: post.poll.expiresAt,
              userVotedOptionId,
              options: post.poll.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                votesCount: opt.votesCount,
                percent:
                  post.poll!.totalVotes > 0
                    ? Math.round((opt.votesCount / post.poll!.totalVotes) * 100)
                    : 0,
              })),
            }
          : null,
      };
    });

    sendSuccess(res, { count: formattedPosts.length, posts: formattedPosts }, 'Community feed loaded');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch community posts';
    console.error('[COMMUNITY] getPosts error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * POST /api/v1/community/posts
 * Body: {
 *   authorName: string;
 *   authorRole?: string;
 *   authorAvatar?: string;
 *   content: string;
 *   type?: 'POST' | 'POLL';
 *   tag?: string;
 *   userId?: string;
 *   userEmail?: string;
 *   pollQuestion?: string;
 *   pollOptions?: string[];
 *   isAdminPost?: boolean;
 * }
 */
export async function createPost(req: Request, res: Response): Promise<void> {
  const {
    authorName,
    authorRole,
    authorAvatar,
    content,
    type = 'POST',
    tag = 'General',
    userId,
    userEmail,
    pollQuestion,
    pollOptions,
    isAdminPost = false,
  } = req.body;

  const isAdminRequest = Boolean(isAdminPost || req.headers['x-admin-token']);
  const cleanUserId = typeof userId === 'string' ? userId.trim() : '';

  if (!isAdminRequest && (!cleanUserId || cleanUserId === 'device-guest-user')) {
    sendError(res, 'Authentication required to create community posts or polls. Please log in.', 401, 'UNAUTHORIZED');
    return;
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    sendError(res, 'Post content is required', 400, 'CONTENT_REQUIRED');
    return;
  }

  const cleanName = (authorName && typeof authorName === 'string' && authorName.trim()) || 'Bullion Trader';
  const cleanRole = (authorRole && typeof authorRole === 'string' && authorRole.trim()) || (isAdminRequest ? 'Admin Official' : 'Community Member');

  try {
    if (type === 'POLL') {
      const question = (pollQuestion && typeof pollQuestion === 'string' && pollQuestion.trim()) || content.trim();
      const validOptions = Array.isArray(pollOptions)
        ? pollOptions.map((opt) => String(opt).trim()).filter((opt) => opt.length > 0)
        : [];

      if (validOptions.length < 2) {
        sendError(res, 'Poll must contain at least 2 non-empty options', 400, 'INVALID_OPTIONS');
        return;
      }

      const created = await prisma.communityPost.create({
        data: {
          authorName: cleanName,
          authorRole: cleanRole,
          authorAvatar: authorAvatar || null,
          content: content.trim(),
          type: 'POLL',
          tag: tag || 'Poll',
          userId: userId || null,
          userEmail: userEmail || null,
          isAdminPost: Boolean(isAdminPost),
          poll: {
            create: {
              question,
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
              options: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      });

      sendSuccess(res, created, 'Poll created successfully', 201);
      return;
    }

    // Standard Post
    const created = await prisma.communityPost.create({
      data: {
        authorName: cleanName,
        authorRole: cleanRole,
        authorAvatar: authorAvatar || null,
        content: content.trim(),
        type: 'POST',
        tag: tag || 'General',
        userId: userId || null,
        userEmail: userEmail || null,
        isAdminPost: Boolean(isAdminPost),
      },
    });

    sendSuccess(res, created, 'Post created successfully', 201);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to create post';
    console.error('[COMMUNITY] createPost error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * PUT /api/v1/community/posts/:id
 * Body: { content: string; userId?: string }
 */
export async function updatePost(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { content, userId } = req.body;

  if (!content || typeof content !== 'string' || !content.trim()) {
    sendError(res, 'Content is required to update', 400, 'CONTENT_REQUIRED');
    return;
  }

  try {
    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      sendError(res, 'Post not found', 404, 'NOT_FOUND');
      return;
    }

    // Check ownership if userId provided
    if (userId && post.userId && post.userId !== userId) {
      sendError(res, 'You are not authorized to edit this post', 403, 'FORBIDDEN');
      return;
    }

    const updated = await prisma.communityPost.update({
      where: { id },
      data: {
        content: content.trim(),
      },
      include: {
        poll: {
          include: {
            options: { orderBy: { orderIndex: 'asc' } },
          },
        },
      },
    });

    sendSuccess(res, updated, 'Post updated successfully');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to update post';
    console.error('[COMMUNITY] updatePost error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * DELETE /api/v1/community/posts/:id
 * Query or Body: { userId?: string }
 */
export async function deletePost(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId =
    (typeof req.body?.userId === 'string' ? req.body.userId : undefined) ||
    (typeof req.query?.userId === 'string' ? (req.query.userId as string) : undefined);

  try {
    const post = await prisma.communityPost.findUnique({ where: { id } });
    if (!post) {
      sendError(res, 'Post not found', 404, 'NOT_FOUND');
      return;
    }

    // If userId provided and not an admin context, ensure author matches
    if (userId && post.userId && post.userId !== userId) {
      sendError(res, 'You are not authorized to delete this post', 403, 'FORBIDDEN');
      return;
    }

    await prisma.communityPost.delete({ where: { id } });
    sendSuccess(res, { id }, 'Post deleted successfully');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to delete post';
    console.error('[COMMUNITY] deletePost error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * POST /api/v1/community/posts/:id/like
 * Body: { userId: string }
 */
export async function toggleLike(req: Request, res: Response): Promise<void> {
  const { id: postId } = req.params;
  const { userId } = req.body;

  const cleanUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!cleanUserId || cleanUserId === 'device-guest-user') {
    sendError(res, 'Authentication required to like posts. Please log in.', 401, 'UNAUTHORIZED');
    return;
  }

  try {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      sendError(res, 'Post not found', 404, 'NOT_FOUND');
      return;
    }

    const existingLike = await prisma.communityLike.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.communityLike.delete({
          where: { postId_userId: { postId, userId } },
        }),
        prisma.communityPost.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      const updated = await prisma.communityPost.findUnique({
        where: { id: postId },
        select: { likesCount: true },
      });

      sendSuccess(res, { liked: false, likesCount: Math.max(0, updated?.likesCount ?? 0) }, 'Post unliked');
      return;
    }

    // Like
    await prisma.$transaction([
      prisma.communityLike.create({
        data: { postId, userId },
      }),
      prisma.communityPost.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    const updated = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: { likesCount: true },
    });

    sendSuccess(res, { liked: true, likesCount: updated?.likesCount ?? 1 }, 'Post liked');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to toggle like';
    console.error('[COMMUNITY] toggleLike error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * GET /api/v1/community/posts/:id/replies
 */
export async function getReplies(req: Request, res: Response): Promise<void> {
  const { id: postId } = req.params;

  try {
    const replies = await prisma.communityReply.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, { count: replies.length, replies }, 'Replies loaded');
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to fetch replies';
    console.error('[COMMUNITY] getReplies error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * POST /api/v1/community/posts/:id/replies
 * Body: { authorName: string; content: string; userId?: string; authorRole?: string; authorAvatar?: string }
 */
export async function createReply(req: Request, res: Response): Promise<void> {
  const { id: postId } = req.params;
  const { authorName, content, userId, authorRole, authorAvatar } = req.body;

  const cleanUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!cleanUserId || cleanUserId === 'device-guest-user') {
    sendError(res, 'Authentication required to post replies. Please log in.', 401, 'UNAUTHORIZED');
    return;
  }

  if (!content || typeof content !== 'string' || !content.trim()) {
    sendError(res, 'Reply text is required', 400, 'CONTENT_REQUIRED');
    return;
  }

  const cleanName = (authorName && typeof authorName === 'string' && authorName.trim()) || 'Gold Trader';

  try {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) {
      sendError(res, 'Post not found', 404, 'NOT_FOUND');
      return;
    }

    const [reply] = await prisma.$transaction([
      prisma.communityReply.create({
        data: {
          postId,
          authorName: cleanName,
          authorRole: authorRole || 'Member',
          authorAvatar: authorAvatar || null,
          content: content.trim(),
          userId: userId || null,
        },
      }),
      prisma.communityPost.update({
        where: { id: postId },
        data: { repliesCount: { increment: 1 } },
      }),
    ]);

    sendSuccess(res, reply, 'Reply posted successfully', 201);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to post reply';
    console.error('[COMMUNITY] createReply error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}

/**
 * POST /api/v1/community/polls/:id/vote
 * Body: { optionId: string; userId: string }
 */
export async function votePoll(req: Request, res: Response): Promise<void> {
  const { id: pollId } = req.params;
  const { optionId, userId } = req.body;

  const cleanUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!cleanUserId || cleanUserId === 'device-guest-user') {
    sendError(res, 'Authentication required to vote on polls. Please log in.', 401, 'UNAUTHORIZED');
    return;
  }

  if (!optionId) {
    sendError(res, 'optionId is required to vote', 400, 'PARAMS_REQUIRED');
    return;
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll) {
      sendError(res, 'Poll not found', 404, 'NOT_FOUND');
      return;
    }

    const targetOption = poll.options.find((opt) => opt.id === optionId);
    if (!targetOption) {
      sendError(res, 'Selected option not found in this poll', 400, 'INVALID_OPTION');
      return;
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: { pollId, userId },
      },
    });

    if (existingVote) {
      if (existingVote.optionId !== optionId) {
        // Switch vote
        await prisma.$transaction([
          prisma.pollVote.update({
            where: { id: existingVote.id },
            data: { optionId },
          }),
          prisma.pollOption.update({
            where: { id: existingVote.optionId },
            data: { votesCount: { decrement: 1 } },
          }),
          prisma.pollOption.update({
            where: { id: optionId },
            data: { votesCount: { increment: 1 } },
          }),
        ]);
      }
    } else {
      // First vote
      await prisma.$transaction([
        prisma.pollVote.create({
          data: { pollId, optionId, userId },
        }),
        prisma.pollOption.update({
          where: { id: optionId },
          data: { votesCount: { increment: 1 } },
        }),
        prisma.poll.update({
          where: { id: pollId },
          data: { totalVotes: { increment: 1 } },
        }),
      ]);
    }

    // Fetch updated poll
    const updatedPoll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: { orderBy: { orderIndex: 'asc' } },
      },
    });

    sendSuccess(
      res,
      {
        pollId,
        totalVotes: updatedPoll?.totalVotes || 0,
        userVotedOptionId: optionId,
        options: updatedPoll?.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votesCount: opt.votesCount,
          percent:
            updatedPoll.totalVotes > 0
              ? Math.round((opt.votesCount / updatedPoll.totalVotes) * 100)
              : 0,
        })),
      },
      'Vote recorded successfully'
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to record vote';
    console.error('[COMMUNITY] votePoll error:', err);
    sendError(res, errMsg, 500, 'DATABASE_ERROR');
  }
}
