const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env. Please define SUPABASE_URL and SUPABASE_ANON_KEY.");
}

// Client for general (anon/user) access - respects RLS
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin Client for background/system tasks - bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

module.exports = { supabase, supabaseAdmin };
