const supabase = require('./src/config/supabase');
const { runSync } = require('./src/controllers/sync.controller');

async function diagnostic() {
  console.log('🔍 Starting Dashboard Diagnostic...\n');

  // 1. Check Users
  const { data: users, error: userErr } = await supabase.from('users').select('*');
  if (userErr) {
    console.error('❌ Error fetching users:', userErr.message);
  } else {
    console.log(`✅ Users found: ${users.length}`);
    users.forEach(u => console.log(`   - ${u.email} (Token: ${u.google_refresh_token ? 'EXISTS' : 'MISSING'})`));
  }

  // 2. Check Cards
  const { data: cards, error: cardErr } = await supabase.from('cards').select('*');
  if (cardErr) {
    console.error('❌ Error fetching cards:', cardErr.message);
  } else {
    console.log(`✅ Cards found: ${cards.length}`);
    cards.forEach(c => console.log(`   - [${c.id}] ${c.bankname} (${c.cardname}) •••• ${c.last4digits}`));
  }

  // 3. Check Bills
  const { data: bills, error: billErr } = await supabase.from('bills').select('*');
  if (billErr) {
    console.error('❌ Error fetching bills:', billErr.message);
  } else {
    console.log(`✅ Bills found: ${bills.length}`);
    bills.forEach(b => console.log(`   - CardID: ${b.cardid}, Amount: ${b.amountdue}, Status: ${b.status}, Due: ${b.duedate}`));
  }

  // 4. Run Triggered Sync
  if (users && users.length > 0 && users[0].google_refresh_token) {
    console.log('\n🚀 Triggering manual sync for first user...');
    await runSync();
  } else {
    console.log('\n⚠️ No authenticated user with Gmail token found to run sync.');
  }

  process.exit();
}

diagnostic();
