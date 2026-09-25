"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const communityController_1 = require("../controllers/communityController");
const router = (0, express_1.Router)();
// Feed & Posts
router.get('/community/posts', communityController_1.getPosts);
router.post('/community/posts', communityController_1.createPost);
router.put('/community/posts/:id', communityController_1.updatePost);
router.delete('/community/posts/:id', communityController_1.deletePost);
// Twitter-like Interactions
router.post('/community/posts/:id/like', communityController_1.toggleLike);
router.get('/community/posts/:id/replies', communityController_1.getReplies);
router.post('/community/posts/:id/replies', communityController_1.createReply);
// Interactive Poll Voting
router.post('/community/polls/:id/vote', communityController_1.votePoll);
exports.default = router;
//# sourceMappingURL=communityRoutes.js.map