const supabase = require('./src/config/supabase');

async function checkSchema() {
  console.log('🔍 Checking Database Schema...');
  
  // Try to query information_schema to see indexes
  const { data: indexes, error: idxErr } = await supabase.rpc('get_table_indexes', { table_name: 'bills' });
  
  if (idxErr) {
    console.error('❌ Could not fetch indexes via RPC. Trying direct query...');
    // Fallback: list of columns
    const { data: columns, error: colErr } = await supabase.from('bills').select('*').limit(0);
    if (colErr) {
      console.error('❌ Error fetching bills table:', colErr.message);
    } else {
      console.log('✅ Bills table exists. Columns might be visible via supabase-js introspection in some environments.');
    }
  } else {
    console.log('✅ Found indexes:', JSON.stringify(indexes, null, 2));
  }

  // Also check cards table
  const { data: cardCols } = await supabase.from('cards').select('*').limit(1);
  console.log('💳 Sample card in DB:', JSON.stringify(cardCols, null, 2));

  process.exit();
}

checkSchema();
