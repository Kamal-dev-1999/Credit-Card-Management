const express = require('express');
const { supabase } = require('../config/supabase');
const { discoverCardsForUser } = require('../controllers/discover.controller');

const router = express.Router();

/**
 * GET /api/cards
 * Fetch all cards for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail || userEmail === 'anonymous-user') {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // TODO: Filter by useremail once column is added to database
    const { data: cards, error } = await supabase
      .from('cards')
      .select('*');

    if (error) throw error;

    res.json(cards || []);
  } catch (err) {
    console.error('❌ [Cards] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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

/**
 * POST /api/cards
 * Create a new card (manual addition)
 */
router.post('/', async (req, res) => {
  try {
    const userEmail = req.user?.email || 'default-user';
    const { bankname, cardname, last4digits, cardtype, colortheme } = req.body;

    // Basic validation
    if (!last4digits || last4digits.length !== 4 || !/^\d{4}$/.test(last4digits)) {
      return res.status(400).json({ error: 'last4digits must be exactly 4 numbers' });
    }

    const { data, error } = await supabase
      .from('cards')
      .insert([{
        bankname: bankname || 'Unknown Bank',
        cardname: cardname || 'Unnamed Card',
        last4digits,
        cardtype: cardtype || 'Visa',
        colortheme: colortheme || 'midnight-purple',
      }])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Cards] New card added: ${bankname} (•••• ${last4digits})`);
    res.json(data);
  } catch (err) {
    console.error('❌ [Cards] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
