import { Router } from 'express';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getReplies,
  createReply,
  votePoll,
} from '../controllers/communityController';

const router = Router();

// Feed & Posts
router.get('/community/posts', getPosts);
router.post('/community/posts', createPost);
router.put('/community/posts/:id', updatePost);
router.delete('/community/posts/:id', deletePost);

// Twitter-like Interactions
router.post('/community/posts/:id/like', toggleLike);
router.get('/community/posts/:id/replies', getReplies);
router.post('/community/posts/:id/replies', createReply);

// Interactive Poll Voting
router.post('/community/polls/:id/vote', votePoll);

export default router;
