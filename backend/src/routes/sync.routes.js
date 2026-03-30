const express = require('express');
const { runSync, syncEmailsForUser } = require('../controllers/sync.controller');

const router = express.Router();

/**
 * GET /api/test/parse-emails
 * Sync and parse emails from Gmail for the current user
 */
router.get('/parse-emails', async (req, res) => {
  try {
    const userEmail = req.user?.email || 'default-user';
    console.log(`📧 [Sync] Starting email sync for user: ${userEmail}`);
    
    const result = await runSync(userEmail);
    res.json(result);
  } catch (error) {
    console.error('❌ [Sync] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
