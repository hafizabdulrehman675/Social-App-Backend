"use strict";

const express = require("express");
const router = express.Router();
const messagesController = require("../controllers/messagesController");
const protect = require("../middleware/protect");

router.post("/threads", protect, messagesController.startThread);
router.get("/threads", protect, messagesController.getThreads);
router.get("/threads/:threadId", protect, messagesController.getMessages);
router.post("/threads/:threadId", protect, messagesController.sendMessage);
router.patch("/threads/:threadId/read", protect, messagesController.markThreadRead);

module.exports = router;
