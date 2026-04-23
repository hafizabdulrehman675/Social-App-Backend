'use strict';

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const protect = require('../middleware/protect');

// Search must come BEFORE /:username — otherwise Express would treat
// the word "search" as a username param and hit getProfile instead
router.get('/search', protect, usersController.searchUsers);

// Public — anyone can view a profile (logged in or not)
router.get('/:username', usersController.getProfile);

// Protected — only the logged-in user can edit their own profile
router.put('/me', protect, usersController.updateProfile);

module.exports = router;
