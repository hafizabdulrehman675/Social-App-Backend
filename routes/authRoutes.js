'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/protect');

// Public routes — no token needed
// Frontend: SignupPage calls this
router.post('/register', authController.register);

// Frontend: LoginPage calls this
router.post('/login', authController.login);

// Protected route — token required
// Frontend: calls this on app startup to restore auth state from localStorage session
router.get('/me', protect, authController.getMe);

module.exports = router;
