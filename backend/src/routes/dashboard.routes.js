const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { validateRequest, UpdateBillStatusSchema } = require('../utils/validation');

const router = express.Router();

/**
 * GET /api/dashboard/summary
 * Fetch dashboard summary with total due and bills
 */
router.get('/summary', async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail || userEmail === 'anonymous-user') {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const cacheKey = `user:${userEmail}:summary`;
    const bypassCache = req.query.nocache === 'true';

    // For now, fetch directly (can add caching later)
    // TODO: Filter by useremail once column is added to database
    const { data: bills, error: billErr } = await supabase
      .from('bills')
      .select('id, amountdue, duedate, statementdate, status, cardid, cards(cardname, last4digits, bankname)')
      .order('duedate', { ascending: true });

    if (billErr) throw billErr;

    // Filter out paid bills and get only the latest bill per card
    const nonPaidBills = (bills || []).filter(b => b.status !== 'Paid');
    
    // Group by card (using last4digits) and keep only the latest bill per card
    const latestBillsByCard = nonPaidBills.reduce((latest, bill) => {
      const cardLast4 = bill.cards?.last4digits || 'unknown';
      const existingIndex = latest.findIndex(b => (b.cards?.last4digits || 'unknown') === cardLast4);
      
      if (existingIndex === -1) {
        latest.push(bill);
      } else {
        const existingBill = latest[existingIndex];
        const existingDate = new Date(existingBill.duedate || 0);
        const billDate = new Date(bill.duedate || 0);
        if (billDate > existingDate) {
          latest[existingIndex] = bill;
        }
      }
      return latest;
    }, []);

    // Calculate totalDue from the latest bills only
    const totalDue = latestBillsByCard.reduce((sum, b) => sum + (b.amountdue || 0), 0);

    res.json({
      totalDue,
      bills: bills || [],
    });
  } catch (err) {
    console.error('❌ [Dashboard] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/bills/:id/status
 * Update the status of a bill (Paid, Upcoming, Overdue)
 */
router.patch('/:id/status', validateRequest(UpdateBillStatusSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount_paid, paid_date } = req.validated;

    const updatePayload = { status };
    if (amount_paid !== undefined) updatePayload.amount_paid = amount_paid;
    if (paid_date) updatePayload.paid_date = paid_date;

    const { data, error } = await supabase
      .from('bills')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ [Dashboard] Bill ${id} status updated to: ${status}`);
    res.json(data);
  } catch (err) {
    console.error('❌ [Dashboard] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/dues-distribution
 * Fetch dues breakdown by bank/card
 */
router.get('/dues-distribution', async (req, res) => {
  try {
    const userEmail = req.user?.email;
    
    if (!userEmail || userEmail === 'anonymous-user') {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // TODO: Filter by useremail once column is added to database
    const { data: bills, error } = await supabase
      .from('bills')
      .select('amountdue, cards(bankname)')
      .neq('status', 'Paid');

    if (error) throw error;

    const distribution = {};
    (bills || []).forEach(bill => {
      const bank = bill.cards?.bankname || 'Unknown';
      distribution[bank] = (distribution[bank] || 0) + (bill.amountdue || 0);
    });

    // Define colors for banks
    const bankColors = {
      'HDFC': '#3B82F6',
      'ICICI': '#8B5CF6',
      'Axis': '#EC4899',
      'Citibank': '#F59E0B',
      'Yes Bank': '#10B981',
      'Kotak': '#EF4444',
      'SBI': '#06B6D4',
      'AMEX': '#F97316'
    };

    // Convert to array format with colors
    const result = Object.entries(distribution).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: bankColors[name] || '#6366F1'
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ [Dashboard] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
