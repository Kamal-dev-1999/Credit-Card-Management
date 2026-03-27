const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { supabase } = require('./src/config/supabase');
const cron = require('node-cron');

const COLORS = ['#ffb000', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d2', '#84cc16'];
const getUniqueColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Credit Card Management API is running (Powered by Supabase)' });
});

// Authentication Routes
const authRoutes = require('./src/routes/auth.routes');
app.use('/api/auth', authRoutes);

// Sync Controller & Cron Job
const { runSync } = require('./src/controllers/sync.controller');

// Manual trigger route (for testing)
app.post('/api/sync', async (req, res) => {
  res.json({ message: 'Sync started in background. Check server logs.' });
  runSync(); // Non-blocking
});

// Cron: Run every 12 hours (at 6am and 6pm)
cron.schedule('0 6,18 * * *', () => {
  console.log('⏰ Cron fired: running 12-hour email sync...');
  runSync();
});
console.log('⏰ Cron job scheduled: email sync every 12 hours (6am & 6pm)');

// Graph Data API — generates a 31-day spending cycle based on due dates
app.get('/api/dashboard/graph-data', async (req, res) => {
  console.log('🟢 HIT: /api/dashboard/graph-data');
  try {
    const { data: bills, error: billErr } = await supabase
      .from('bills')
      .select('amountdue, duedate, cards(bankname, cardname)')
      .filter('status', 'neq', 'Paid');

    if (billErr) throw billErr;

    // We generate a 31-day data set
    const graphData = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      name: (i + 1).toString(),
    }));

    const cardKeys = new Set();
    
    (bills || []).forEach(bill => {
      const bank = bill.cards?.bankname || 'Card';
      cardKeys.add(bank);
      const dueDate = new Date(bill.duedate);
      const dueDay = dueDate.getDate();
      const amount = bill.amountdue || 0;

      // Simulate a "cycle" by distributing the amount cumulatively over 30 days leading to the due date
      // This makes the AreaChart look like a growth curve ending at the deadline
      for (let d = 1; d <= 31; d++) {
        const key = `${bank}Spend`;
        if (!graphData[d - 1][key]) graphData[d - 1][key] = 0;
        
        if (d <= dueDay) {
          // Cumulative growth: (current_day / due_day) * total_amount
          graphData[d - 1][key] = (graphData[d - 1][key] || 0) + Math.round((d / dueDay) * amount);
        } else {
          // Stay flat after due date
          graphData[d - 1][key] = (graphData[d - 1][key] || 0) + amount;
        }
      }
    });

    res.json({
      data: graphData,
      keys: Array.from(cardKeys).map(k => `${k}Spend`),
      banks: Array.from(cardKeys),
      dueDates: (bills || []).map(b => ({
        day: new Date(b.duedate).getDate(),
        bank: b.cards?.bankname,
        amount: b.amountdue
      }))
    });
  } catch (err) {
    console.error('❌ Graph data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Summary API — replaces mock data on the frontend
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const { data: bills, error: billErr } = await supabase
      .from('bills')
      .select('id, amountdue, duedate, statementdate, status, cardid, cards(cardname, last4digits, bankname)')
      .order('duedate', { ascending: true });

    if (billErr) throw billErr;

    const totalDue = (bills || [])
      .filter(b => b.status !== 'Paid')
      .reduce((sum, b) => sum + (b.amountdue || 0), 0);

    res.json({
      totalDue,
      bills: bills || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/dues-distribution', async (req, res) => {
  try {
    const { data: bills, error } = await supabase
      .from('bills')
      .select('amountdue, status, cards(cardname, id)')
      .neq('status', 'Paid');

    if (error) throw error;

    const distribution = {};
    (bills || []).forEach(b => {
      const name = b.cards?.cardname || 'Other Card';
      const id = b.cards?.id || 'other';
      if (!distribution[name]) {
        distribution[name] = { name, value: 0, color: getUniqueColor(id) };
      }
      distribution[name].value += (b.amountdue || 0);
    });

    res.json(Object.values(distribution).filter(d => d.value > 0));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gmail + AI Parsing Services (kept for raw testing)
const { fetchCreditCardEmails } = require('./src/services/gmailService');
const { parseEmailWithAI } = require('./src/services/aiParser');

// Test Route: Fetch + Parse Gmail emails for ALL authenticated users
app.get('/api/test/parse-emails', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, google_refresh_token')
      .not('google_refresh_token', 'is', null)
      .order('created_at', { ascending: false }); // newest first

    if (error) throw error;
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No authenticated user found. Please connect Gmail first.' });
    }

    console.log(`\n🚀 Found ${users.length} authenticated user(s):`);
    users.forEach(u => console.log(`  - ${u.email}`));

    const allResults = [];

    for (const user of users) {
      console.log(`\n📬 Fetching emails for: ${user.email}`);
      const { fetchCreditCardEmails } = require('./src/services/gmailService');
      const { parseEmailWithAI } = require('./src/services/aiParser');

      const emails = await fetchCreditCardEmails(user.google_refresh_token);
      if (emails.length === 0) {
        console.log('  📭 No relevant emails found.');
        continue;
      }

      for (const email of emails) {
        console.log(`\n  🤖 Parsing: "${email.subject}"`);
        const parsed = await parseEmailWithAI(email);
        if (parsed) {
          console.log('  ✅ Parsed result:', JSON.stringify(parsed, null, 2));
          allResults.push({ user: user.email, ...parsed, _source: email.subject });
        } else {
          console.log('  ⏭️  Skipped (irrelevant or parse failed)');
        }
      }
    }

    console.log(`\n🎯 Total parsed: ${allResults.length} across ${users.length} account(s)`);
    res.json({ users: users.map(u => u.email), parsed_count: allResults.length, results: allResults });

  } catch (err) {
    console.error('❌ Test route error:', err);
    res.status(500).json({ error: err.message });
  }
});

const { syncAIInsights, generateDailyInsights } = require('./src/services/geminiService');

// AI Insights Endpoint: Fetch the most recent stored insights
app.get('/api/ai/latest', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    
    // If no insights exist, generate them for the first time
    if (!data || data.length === 0) {
      console.log('🤖 No AI insights found in DB. Generating first one...');
      try {
        const fresh = await syncAIInsights();
        return res.json(fresh);
      } catch (genErr) {
        console.error('❌ AI generation failed:', genErr.message);
        // Return fallback only if generation truly fails
        return res.status(503).json({ 
          error: 'AI insights generation failed', 
          reason: genErr.message,
          fallback: {
            daily_quote: "The first step to financial freedom is knowing your numbers. Sync your data to see your pulse.",
            projected_savings: 0,
            card_insights: [],
            health_explanation: "You haven't added any cards yet. Let's start building your financial profile!"
          }
        });
      }
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual AI generation
app.post('/api/ai/sync', async (req, res) => {
  try {
    const fresh = await syncAIInsights();
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron: Sync AI Insights every 24 hours at midnight
cron.schedule('0 0 * * *', () => {
  console.log('⏰ Cron fired: Generating daily AI insights...');
  syncAIInsights();
});
console.log('⏰ Cron job scheduled: AI Insights every 24 hours (Midnight)');

// Financial News Endpoint
const { getFinancialNews } = require('./src/services/newsService');

app.get('/api/news/financial', async (req, res) => {
  try {
    console.log('📰 Fetching financial news...');
    const news = await getFinancialNews();
    res.json({ success: true, articles: news, count: news.length });
  } catch (err) {
    console.error('❌ News fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { discoverCardsForUser } = require('./src/controllers/discover.controller');

// Auto-Discover Cards from Gmail
app.post('/api/cards/discover', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, google_refresh_token')
      .not('google_refresh_token', 'is', null)
      .limit(1); // For now, we discover for the first authenticated user found

    if (error) throw error;
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No authenticated user found. Please connect Gmail first.' });
    }

    const result = await discoverCardsForUser(users[0]);
    res.json(result);
  } catch (err) {
    console.error('❌ Discovery error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Cards
app.get('/api/cards', async (req, res) => {
  try {
    const { data: cards, error } = await supabase.from('cards').select('*');
    if (error) throw error;
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const { cardName, bankName, last4Digits, cardType, creditLimit, userId, billingCycleDate, colorTheme } = req.body;
    const { data, error } = await supabase
      .from('cards')
      .insert([{ 
        cardname: cardName, 
        bankname: bankName, 
        last4digits: last4Digits, 
        billingcycledate: billingCycleDate || 1,
        userid: userId,
        cardtype: cardType || 'Visa',
        colortheme: colorTheme || 'purple'
      }])
      .select();
    
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cardName, bankName, last4Digits, cardType, creditLimit, colorTheme } = req.body;
    const { data, error } = await supabase
      .from('cards')
      .update({ 
        cardname: cardName, 
        bankname: bankName, 
        last4digits: last4Digits,
        cardtype: cardType,
        colortheme: colorTheme
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First delete associated bills/expenses (Supabase handles this if ON DELETE CASCADE is set, 
    // but we'll do it manually if not or just let it error if restricted)
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bills
app.get('/api/bills', async (req, res) => {
  try {
    const { data: bills, error } = await supabase.from('bills').select('*');
    if (error) throw error;
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/bills/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const { data, error } = await supabase
      .from('bills')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('❌ Bill status update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const { data: expenses, error } = await supabase.from('expenses').select('*');
    if (error) throw error;
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Suggestion Engine Placeholder
app.post('/api/suggestions', async (req, res) => {
  res.json({ message: 'AI Suggestion Engine endpoint ready to be implemented' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Keep process alive and expose any hidden crash reasons
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
