/**
 * discover.controller.js
 * Historical Gmail scanning for automatic credit card registration.
 */

'use strict';

const { supabase } = require('../config/supabase');
const { fetchCreditCardEmails } = require('../services/gmailService');
const { processEmail } = require('../utils/parserRules');

/**
 * discoverCardsForUser()
 * Scans the last 180 days of Gmail to identify unique credit cards.
 * Automatically registers new cards with default settings.
 */
const discoverCardsForUser = async (user) => {
  // Starting card discovery...

  // ── Step 1: Fetch historical emails (180 days) ───────────────────────────
  let emails;
  try {
    // We scan 180 days back to be sure we catch at least one statement per card
    emails = await fetchCreditCardEmails(user.google_refresh_token, 180);
  } catch (err) {
    console.error(`❌ Card discovery failed:`, err.message);
    return { success: false, error: err.message };
  }

  if (!emails || emails.length === 0) {
    return { success: true, newCardsFound: 0 };
  }

  // Analyzing emails...

  const discoveredCards = new Map(); // Key: "Bank_Last4"

  // ── Step 2: Extract unique card identifiers ──────────────────────────────
  for (const email of emails) {
    const parsed = processEmail(email);
    if (parsed && parsed.bankName && parsed.last4Digits) {
      const key = `${parsed.bankName}_${parsed.last4Digits}`;
      if (!discoveredCards.has(key)) {
        discoveredCards.set(key, {
          bankname: parsed.bankName,
          last4digits: parsed.last4Digits,
        });
      }
    }
  }

  // Card identification complete

  if (discoveredCards.size === 0) {
    return { success: true, newCardsFound: 0 };
  }

  // ── Step 3: Check against existing cards and register new ones ──────────
  let addedCount = 0;
  for (const [_, info] of discoveredCards) {
    try {
      // Check if this card already exists for this user
      const { data: existing } = await supabase
        .from('cards')
        .select('id')
        .eq('userid', user.id)
        .eq('bankname', info.bankname)
        .eq('last4digits', info.last4digits)
        .limit(1);

      if (existing && existing.length > 0) {
        continue;
      }

      // Register new card with default settings
      const newCard = {
        userid: user.id,
        bankname: info.bankname,
        cardname: `${info.bankname} Card`, // Default nickname
        last4digits: info.last4digits,
        billingcycledate: 1, // Default billing day
      };

      const { error: insertErr } = await supabase
        .from('cards')
        .insert([newCard]);

      if (insertErr) {
        console.error(`  ❌ Card registration failed:`, insertErr.message);
      } else {
        addedCount++;
      }
    } catch (err) {
      console.error(`  ❌ Card processing error:`, err.message);
    }
  }

  // Discovery complete
  return { success: true, newCardsFound: addedCount };
};

module.exports = { discoverCardsForUser };
