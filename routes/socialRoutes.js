'use strict';

const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');
const protect = require('../middleware/protect');

router.get('/me',                         protect, socialController.getMySocialState);
router.get('/state',                      protect, socialController.getMySocialState);
router.post('/follow/:userId',             protect, socialController.sendFollowRequest);
router.delete('/follow/:userId',           protect, socialController.cancelOrUnfollow);
router.get('/follow-requests',             protect, socialController.getFollowRequests);
router.patch('/follow-requests/:requestId', protect, socialController.respondToRequest);

module.exports = router;
