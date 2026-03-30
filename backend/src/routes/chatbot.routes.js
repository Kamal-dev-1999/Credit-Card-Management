const express = require('express');
const {
  getConversationHistoryController,
  askChatbotController
} = require('../controllers/chatbot.controller');

const router = express.Router();

/**
 * GET /api/chatbot/history/:userEmail
 * Fetch conversation history for a user
 */
router.get('/history/:userEmail', getConversationHistoryController);

/**
 * POST /api/chatbot/ask
 * Send a message to the chatbot and get a response
 */
router.post('/ask', askChatbotController);

module.exports = router;
