import { Request, Response } from 'express';
/**
 * GET /api/v1/community/posts
 * Query: ?userId=... & ?tag=...
 */
export declare function getPosts(req: Request, res: Response): Promise<void>;
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
export declare function createPost(req: Request, res: Response): Promise<void>;
/**
 * PUT /api/v1/community/posts/:id
 * Body: { content: string; userId?: string }
 */
export declare function updatePost(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/v1/community/posts/:id
 * Query or Body: { userId?: string }
 */
export declare function deletePost(req: Request, res: Response): Promise<void>;
/**
 * POST /api/v1/community/posts/:id/like
 * Body: { userId: string }
 */
export declare function toggleLike(req: Request, res: Response): Promise<void>;
/**
 * GET /api/v1/community/posts/:id/replies
 */
export declare function getReplies(req: Request, res: Response): Promise<void>;
/**
 * POST /api/v1/community/posts/:id/replies
 * Body: { authorName: string; content: string; userId?: string; authorRole?: string; authorAvatar?: string }
 */
export declare function createReply(req: Request, res: Response): Promise<void>;
/**
 * POST /api/v1/community/polls/:id/vote
 * Body: { optionId: string; userId: string }
 */
export declare function votePoll(req: Request, res: Response): Promise<void>;
