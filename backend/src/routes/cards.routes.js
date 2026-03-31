const express = require('express');
const { supabase } = require('../config/supabase');
const { discoverCardsForUser } = require('../controllers/discover.controller');
const { validateRequest, CreateCardSchema, UpdateCardSchema } = require('../utils/validation');

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
router.post('/', validateRequest(CreateCardSchema), async (req, res) => {
  try {
    const userEmail = req.user?.email || 'default-user';
    const { bankname, cardname, last4digits, cardtype, colortheme } = req.validated;

    const { data, error } = await supabase
      .from('cards')
      .insert([{
        bankname,
        cardname,
        last4digits,
        cardtype: cardtype || 'credit',
        colortheme: colortheme || 'midnight-purple',
      }])
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Cards] New card added: ${bankname} (•••• ${last4digits})`);
    res.status(201).json(data);
  } catch (err) {
    console.error('❌ [Cards] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/cards/:id
 * Delete a card by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ [Cards] Card ${id} deleted successfully`);
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (err) {
    console.error('❌ [Cards] Error deleting card:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/cards/:id
 * Update a card by ID
 */
router.put('/:id', validateRequest(UpdateCardSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, cardName, last4Digits, cardType, colorTheme, billingCycleDate } = req.validated;

    const updateData = {};
    if (bankName) updateData.bankname = bankName;
    if (cardName) updateData.cardname = cardName;
    if (last4Digits) updateData.last4digits = last4Digits;
    if (cardType) updateData.cardtype = cardType;
    if (colorTheme) updateData.colortheme = colorTheme;
    if (billingCycleDate !== undefined) updateData.billingcycledate = billingCycleDate;

    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Cards] Card ${id} updated successfully`);
    res.json(data);
  } catch (err) {
    console.error('❌ [Cards] Error updating card:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
