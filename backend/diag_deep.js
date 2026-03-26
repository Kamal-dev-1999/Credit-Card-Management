const supabase = require('./src/config/supabase');
const { fetchCreditCardEmails } = require('./src/services/gmailService');
const { processEmail } = require('./src/utils/parserRules');

async function diagnostic() {
  console.log('🔍 Starting Deep Data Diagnostic...\n');

  const { data: users } = await supabase.from('users').select('*').not('google_refresh_token', 'is', null).limit(1);
  if (!users || users.length === 0) {
    console.log('❌ No authenticated user found.');
    return;
  }
  const user = users[0];
  console.log(`👤 User: ${user.email}`);

  const { data: cards } = await supabase.from('cards').select('*');
  console.log(`💳 Cards in DB: ${cards.map(c => `${c.bankname} (•••• ${c.last4digits})`).join(', ')}`);

  console.log('\n📥 Fetching emails from last 60 days...');
  const emails = await fetchCreditCardEmails(user.google_refresh_token, 60);

  console.log(`\n📊 Analyzing ${emails.length} emails:`);
  let parsedCount = 0;
  for (const email of emails) {
    console.log(`\n--- Subject: ${email.subject} ---`);
    const parsed = processEmail(email);
    if (parsed) {
      parsedCount++;
      console.log(`✅ Parsed: ₹${parsed.amountDue} for ${parsed.bankName} (STMT: ${parsed.statementDate}, DUE: ${parsed.dueDate})`);
      
      // Check for card match
      const cardMatch = cards.find(c => 
        (parsed.last4Digits && c.last4digits.endsWith(parsed.last4Digits)) || 
        (c.bankname && c.bankname.toLowerCase().includes(parsed.bankName.toLowerCase()))
      );
      if (cardMatch) {
         console.log(`🔗 MATCHED to card: ${cardMatch.bankname} (ID: ${cardMatch.id})`);
      } else {
         console.log(`⚠️ NO MATCH in database for extracted Last4: ${parsed.last4Digits} / Bank: ${parsed.bankName}`);
      }
    } else {
      console.log(`❌ Failed to parse. Body snippet (first 500 chars):`);
      // Strip HTML manually for display
      const snippet = email.body.replace(/<[^>]+>/g, ' ').substring(0, 500);
      console.log(`"${snippet}..."`);
    }
  }

  console.log(`\n🎯 Summary: ${parsedCount}/${emails.length} parsed.`);
  process.exit();
}

diagnostic();
