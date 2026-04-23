'use strict';

const express = require('express');
const router = express.Router();
const postsController      = require('../controllers/postsController');
const commentsController   = require('../controllers/commentsController');
const likesController      = require('../controllers/likesController');
const savedPostsController = require('../controllers/savedPostsController');
const protect = require('../middleware/protect');

// feed must come before /:postId — otherwise "feed" would be treated as a postId
router.get('/feed', protect, postsController.getFeed);

router.post('/',           protect, postsController.createPost);
router.get('/:postId',              postsController.getPost);
router.delete('/:postId',  protect, postsController.deletePost);

// Comments — nested under posts
router.get('/:postId/comments',                                    commentsController.getComments);
router.post('/:postId/comments',                        protect,   commentsController.addComment);
router.delete('/:postId/comments/:commentId',           protect,   commentsController.deleteComment);
router.get('/:postId/comments/:commentId/replies',                 commentsController.getReplies);

// Likes
router.post('/:postId/like',    protect, likesController.likePost);
router.delete('/:postId/like',  protect, likesController.unlikePost);

// Save
router.post('/:postId/save',    protect, savedPostsController.savePost);
router.delete('/:postId/save',  protect, savedPostsController.unsavePost);

module.exports = router;
