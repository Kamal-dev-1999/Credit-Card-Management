const express = require('express');
const { discoverCardsForUser } = require('../controllers/discover.controller');

const router = express.Router();

/**
 * POST /api/cards/discover
 * Discover new credit cards from Gmail emails
 */
router.post('/discover', async (req, res) => {
  try {
    const userEmail = req.user?.email || 'default-user';
    const result = await discoverCardsForUser(userEmail);
    res.json(result);
  } catch (error) {
    console.error('❌ [Discover] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
