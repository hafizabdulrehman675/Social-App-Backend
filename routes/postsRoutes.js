'use strict';

const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const protect = require('../middleware/protect');

// feed must come before /:postId — otherwise "feed" would be treated as a postId
router.get('/feed', protect, postsController.getFeed);

router.post('/',            protect, postsController.createPost);
router.get('/:postId',               postsController.getPost);
router.delete('/:postId',   protect, postsController.deletePost);

module.exports = router;
