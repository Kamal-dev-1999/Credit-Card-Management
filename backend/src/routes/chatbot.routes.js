const express = require('express');
const {
  getConversationHistoryController,
  askChatbotController
} = require('../controllers/chatbot.controller');
const { validateRequest, ChatbotHistoryParamSchema, ChatbotMessageSchema } = require('../utils/validation');

const router = express.Router();

/**
 * GET /api/chatbot/history/:userEmail
 * Fetch conversation history for a user
 */
router.get('/history/:userEmail', validateRequest(ChatbotHistoryParamSchema, 'params'), getConversationHistoryController);

/**
 * POST /api/chatbot/ask
 * Send a message to the chatbot and get a response
 */
router.post('/ask', validateRequest(ChatbotMessageSchema), askChatbotController);

module.exports = router;
