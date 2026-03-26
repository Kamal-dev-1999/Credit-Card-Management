/**
 * sync.controller.js
 * Orchestrates the full Gmail → Rule-Based Parse → Supabase upsert pipeline.
 * 100% rule-based. Zero AI / API tokens used.
 */

'use strict';

const supabase = require('../config/supabase');
const { fetchCreditCardEmails } = require('../services/gmailService');
const { processEmail } = require('../utils/parserRules');

/**
 * Determines bill status based on due date vs today.
 */
const computeStatus = (dueDate) => {
  if (!dueDate) return 'Upcoming';
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today ? 'Outstanding' : 'Upcoming';
};

/**
 * Syncs emails for a single authenticated user.
 *  1. Fetches emails from Gmail via stored refresh token.
 *  2. Parses each email using parserRules.js (regex-only).
 *  3. Upserts new bills or marks existing bills as Paid.
 *
 * @param {Object} user - { id, email, google_refresh_token }
 */
const syncEmailsForUser = async (user) => {
  console.log(`\n🔄 [Sync] Starting for: ${user.email}`);

  // ── Step 1: Fetch from Gmail ──────────────────────────────────────────────
  let emails;
  try {
    emails = await fetchCreditCardEmails(user.google_refresh_token);
  } catch (err) {
    console.error(`❌ [Sync] Gmail fetch failed for ${user.email}:`, err.message);
    return { success: false, error: err.message };
  }

  if (!emails || emails.length === 0) {
    console.log('  📭 No matching emails found in Gmail.');
    return { success: true, processed: 0, skipped: 0 };
  }

  console.log(`  📬 ${emails.length} email(s) to process.`);

  let processed = 0;
  let skipped = 0;

  // ── Step 2: Parse + Upsert each email ────────────────────────────────────
  for (const email of emails) {
    console.log(`\n  📧 Processing: "${email.subject}"`);

    // Rule-based extraction — zero AI
    const parsed = processEmail(email);

    if (!parsed) {
      skipped++;
      continue;
    }

    // ── Find matching card by last4Digits ──
    let card = null;
    if (parsed.last4Digits) {
      const isPartial = parsed.last4Digits.length < 4;
      const query = supabase.from('cards').select('id, cardname, bankname');
      
      const { data: cards, error: cardErr } = await (
        isPartial 
          ? query.ilike('last4digits', `%${parsed.last4Digits}`) 
          : query.eq('last4digits', parsed.last4Digits)
      ).limit(1);

      if (cardErr) {
        console.error('  ❌ Card lookup error:', cardErr.message);
        skipped++;
        continue;
      }
      card = cards?.[0] || null;
    }

    // If no card matched, try matching by bank name
    if (!card) {
      const { data: cards } = await supabase
        .from('cards')
        .select('id, cardname, bankname')
        .ilike('bankname', `%${parsed.bankName}%`)
        .limit(1);
      card = cards?.[0] || null;
    }

    if (!card) {
      console.warn(`  ⚠️  No card found for ${parsed.bankName} •••• ${parsed.last4Digits || '????'}. Add this card in Manage Cards first.`);
      skipped++;
      continue;
    }

    console.log(`  🃏 Matched card: ${card.cardname} (${card.bankname})`);

    // ── Handle Payment Confirmation ──
    if (parsed.isPaymentConfirmation) {
      const { error: updateErr } = await supabase
        .from('bills')
        .update({ status: 'Paid' })
        .eq('cardid', card.id)
        .in('status', ['Upcoming', 'Outstanding']);

      if (updateErr) {
        console.error('  ❌ Failed to mark bill as Paid:', updateErr.message);
      } else {
        console.log(`  ✅ Marked bill(s) for ${card.cardname} as Paid.`);
        processed++;
      }
      continue;
    }

    // ── Handle New Bill / Statement ──
    if (!parsed.amountDue) {
      console.warn('  ⚠️  No amount found — skipping.');
      skipped++;
      continue;
    }

    const status = computeStatus(parsed.dueDate);
    const today = new Date().toISOString().split('T')[0];

    const billRecord = {
      cardid:        card.id,
      amountdue:     parsed.amountDue,
      duedate:       parsed.dueDate || null,
      statementdate: parsed.statementDate || today,
      status,
    };

    // Upsert: unique on (cardid, duedate) to prevent duplicate bills
    const { error: upsertErr } = await supabase
      .from('bills')
      .upsert([billRecord], {
        onConflict: 'cardid, duedate',
        ignoreDuplicates: false,
      });

    if (upsertErr) {
      console.error('  ❌ Upsert failed:', upsertErr.message);
      skipped++;
    } else {
      console.log(`  ✅ Saved: ${card.cardName} — ₹${parsed.amountDue} due ${parsed.dueDate || 'unknown date'} [${status}]`);
      processed++;
    }
  }

  const summary = { success: true, processed, skipped, total: emails.length };
  console.log(`\n  🎯 Done: ${processed} saved, ${skipped} skipped out of ${emails.length} emails.`);
  return summary;
};

/**
 * runSync() — Fetches all authenticated users and syncs each inbox.
 * Called by the cron job (every 12 hours) or the manual POST /api/sync endpoint.
 */
const runSync = async () => {
  console.log('\n⏰ [Cron] Starting scheduled email sync...');

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, google_refresh_token')
    .not('google_refresh_token', 'is', null);

  if (error) {
    console.error('❌ Could not fetch users:', error.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('📭 No authenticated users to sync.');
    return;
  }

  console.log(`👥 Syncing ${users.length} user account(s)...`);

  for (const user of users) {
    await syncEmailsForUser(user);
  }

  console.log('\n✅ [Cron] All users synced.\n');
};

module.exports = { runSync, syncEmailsForUser };
