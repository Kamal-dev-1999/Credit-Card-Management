const express = require('express');
const { supabase } = require('../config/supabase');
const { generateDailyInsights } = require('../services/geminiService');

const router = express.Router();

/**
 * GET /api/ai/latest
 * Fetch latest cached daily insights
 */
router.get('/latest', async (req, res) => {
  try {
    const bypassCache = req.query.nocache === 'true';
    const cacheKey = 'ai:daily_insights';

    // Default response structure
    const defaultInsights = {
      daily_quote: "Your wealth grows from what you keep, not just what you make.",
      projected_savings: 0,
      card_insights: [],
      health_explanation: "Keep maintaining on-time payments to see your health score rise.",
      generated_at: new Date().toISOString()
    };

    // Try to fetch from cache (Redis would go here, for now use Supabase)
    if (!bypassCache) {
      const { data: cached } = await supabase
        .from('cache')
        .select('data')
        .eq('key', cacheKey)
        .single();

      if (cached?.data) {
        return res.json(JSON.parse(cached.data));
      }
    }

    res.json(defaultInsights);
  } catch (error) {
    console.error('❌ [AI Latest] Error:', error.message);
    res.json({
      daily_quote: "Your wealth grows from what you keep, not just what you make.",
      projected_savings: 0,
      card_insights: [],
      health_explanation: "Keep maintaining on-time payments to see your health score rise."
    });
  }
});

/**
 * POST /api/ai/sync
 * Generate fresh daily insights from email data
 */
router.post('/sync', async (req, res) => {
  try {
    const insights = await generateDailyInsights();

    // Structure response with all required fields
    const response = {
      daily_quote: insights.daily_quote || "Your wealth grows from what you keep, not just what you make.",
      projected_savings: typeof insights.projected_savings === 'number' ? insights.projected_savings : 0,
      card_insights: Array.isArray(insights.card_insights) ? insights.card_insights : [],
      health_explanation: insights.health_explanation || "Keep maintaining on-time payments to see your health score rise.",
      generated_at: new Date().toISOString()
    };

    console.log('✅ [AI Sync] Insights generated successfully');
    res.json(response);
  } catch (error) {
    console.error('❌ [AI Sync] Error:', error.message);
    res.status(500).json({ 
      error: error.message,
      daily_quote: "Unable to generate insights at this moment.",
      projected_savings: 0,
      card_insights: [],
      health_explanation: "Please try again later."
    });
  }
});

/**
 * GET /api/ai/insights
 * Fetch daily AI-generated financial insights
 */
router.get('/insights', async (req, res) => {
  try {
    const insights = await generateDailyInsights();
    res.json(insights || {});
  } catch (error) {
    console.error('❌ [AI] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
