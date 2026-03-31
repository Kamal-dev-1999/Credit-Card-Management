const express = require('express');
const { getFinancialNews } = require('../services/newsService');

const router = express.Router();

/**
 * GET /api/news/financial
 * Fetch financial news from multiple sources
 */
router.get('/financial', async (req, res) => {
  try {
    const articles = await getFinancialNews();
    res.json({ articles: articles || [] });
  } catch (error) {
    console.error('❌ [News] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
