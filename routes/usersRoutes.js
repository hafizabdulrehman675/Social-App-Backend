'use strict';

const express = require('express');
const router = express.Router();
const usersController  = require('../controllers/usersController');
const socialController = require('../controllers/socialController');
const protect = require('../middleware/protect');

router.get('/',       protect, usersController.getAllUsers);
router.get('/search', protect, usersController.searchUsers);
router.put('/me',     protect, usersController.updateProfile);

router.get('/:username',           usersController.getProfile);
router.get('/:username/followers', socialController.getFollowers);
router.get('/:username/following', socialController.getFollowing);

module.exports = router;
