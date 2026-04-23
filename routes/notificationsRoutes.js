'use strict';

const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const protect = require('../middleware/protect');

// read-all must come before /:id — otherwise "read-all" would be treated as an id
router.patch('/read-all',   protect, notificationsController.markAllRead);
router.patch('/:id/read',   protect, notificationsController.markOneRead);
router.get('/',             protect, notificationsController.getNotifications);

module.exports = router;
