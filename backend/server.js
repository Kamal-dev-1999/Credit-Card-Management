const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { supabase } = require('./src/config/supabase');
const cron = require('node-cron');
const { initRedis, getCachedData, deleteCache, deleteCachePattern } = require('./src/utils/redisClient.js');

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
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Redis
initRedis().catch(err => {
  console.warn(`⚠️  Redis initialization warning: ${err.message}`);
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Credit Card Management API is running (Powered by Supabase)' });
});

// Authentication Routes
const authRoutes = require('./src/routes/auth.routes');
app.use('/api/auth', authRoutes);

// Notification Routes
const notificationRoutes = require('./src/routes/notification.routes.js');
app.use('/api/notifications', notificationRoutes);

// Sync Controller & Cron Job
const { runSync } = require('./src/controllers/sync.controller');

// Manual trigger route (for testing)
app.post('/api/sync', async (req, res) => {
  res.json({ message: 'Sync started in background. Check server logs.' });
  
  // Non-blocking sync with cache invalidation
  runSync().then(async () => {
    const userEmail = req.headers['x-user-email'] || 'default-user';
    
    // ✨ Invalidate related caches after successful sync
    await deleteCachePattern(`user:*:summary`);
    await deleteCachePattern(`user:*:daily_insights`);
    console.log('🔄 Invalidated summary and daily_insights caches after email sync');
  }).catch(err => {
    console.error('❌ Sync error:', err.message);
  });
});

// Cron: Run every 12 hours (at 6am and 6pm)
cron.schedule('0 6,18 * * *', async () => {
  console.log('⏰ Cron fired: running 12-hour email sync...');
  await runSync();
  
  // ✨ Invalidate caches after sync completes (bills may have changed)
  await deleteCachePattern('user:*:summary');
  await deleteCachePattern('user:*:daily_insights');
  console.log('🔄 Caches invalidated after email sync: summary, daily_insights');
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
    const userEmail = req.headers['x-user-email'] || 'default-user';
    const cacheKey = `user:${userEmail}:summary`;
    const bypassCache = req.query.nocache === 'true'; // Allow bypassing cache with ?nocache=true

    // Use Cache-Aside pattern, but skip if bypassing cache
    const data = await getCachedData(cacheKey, async () => {
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
          // First bill for this card
          latest.push(bill);
        } else {
          // Keep the bill with the latest due date
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

      return {
        totalDue,
        bills: bills || [],
      };
    }, bypassCache ? 0 : 600); // Skip cache (0 sec) if nocache=true, else cache for 10 minutes

    res.json(data);
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

    console.log(`🚀 Fetching emails for authenticated user(s)`);

    const allResults = [];
    let billsSaved = 0;
    let billsSkipped = 0;

    for (const user of users) {
      console.log(`📬 Fetching emails...`);
      const { fetchCreditCardEmails } = require('./src/services/gmailService');
      const { parseEmailWithAI } = require('./src/services/aiParser');

      const emails = await fetchCreditCardEmails(user.google_refresh_token);
      if (emails.length === 0) {
        console.log('  📭 No relevant emails found.');
        continue;
      }

      for (const email of emails) {
        const parsed = await parseEmailWithAI(email);
        if (parsed) {
          //  ✅ Email parsed successfully
          allResults.push({ user: user.email, ...parsed, _source: email.subject });

          // ✅ NOW SAVE TO DATABASE
          if (parsed.bankName && parsed.amountDue) {
            // Saving bill to database...
            
            // Find the card for this user with matching bank
            const { data: cards, error: cardErr } = await supabase
              .from('cards')
              .select('id')
              .eq('userid', user.id)
              .eq('bankname', parsed.bankName)
              .limit(1);

            if (cardErr) {
              console.error(`    ❌ Error finding card: ${cardErr.message}`);
              billsSkipped++;
              continue;
            }

            if (!cards || cards.length === 0) {
              console.warn(`    ⚠️  No card found for ${parsed.bankName}. Skipping bill.`);
              billsSkipped++;
              continue;
            }

            const cardId = cards[0].id;

            // Check if this bill already exists (by cardid + duedate + amount)
            const { data: existingBills } = await supabase
              .from('bills')
              .select('id')
              .eq('cardid', cardId)
              .eq('amountdue', parsed.amountDue)
              .eq('duedate', parsed.dueDate || null)
              .limit(1);

            if (existingBills && existingBills.length > 0) {
              console.log(`    ⏭️  Bill already exists, skipping.`);
              billsSkipped++;
              continue;
            }

            // Insert new bill
            const { error: billErr } = await supabase
              .from('bills')
              .insert([{
                cardid: cardId,
                amountdue: parsed.amountDue,
                duedate: parsed.dueDate || new Date().toISOString().split('T')[0],
                statementdate: parsed.statementDate || new Date().toISOString().split('T')[0],
                status: 'Unpaid'
              }]);

            if (billErr) {
              console.error(`    ❌ Error saving bill: ${billErr.message}`);
              billsSkipped++;
            } else {
              // Bill saved successfully
              billsSaved++;
              
              // Clear cache now that we've updated bills
              await deleteCache(`user:${user.email}:summary`);
            }
          } else {
            console.log(`  ⏭️  No billing data to save (amount or bank missing)`);
            billsSkipped++;
          }
        } else {
          console.log('  ⏭️  Skipped (irrelevant or parse failed)');
        }
      }
    }

    console.log(`🎯 Email sync completed`);
    res.json({ 
      users: users.map(u => u.email), 
      parsed_count: allResults.length,
      bills_saved: billsSaved,
      bills_skipped: billsSkipped,
      results: allResults 
    });

  } catch (err) {
    console.error('❌ Test route error:', err);
    res.status(500).json({ error: err.message });
  }
});

const { syncAIInsights, generateDailyInsights } = require('./src/services/geminiService');

// AI Insights Endpoint: Fetch the most recent stored insights
app.get('/api/ai/latest', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || 'default-user';
    const cacheKey = `user:${userEmail}:daily_insights`;
    const bypassCache = req.query.nocache === 'true';

    const data = await getCachedData(cacheKey, async () => {
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
          return fresh;
        } catch (genErr) {
          console.error('❌ AI generation failed:', genErr.message);
          return {
            error: 'AI insights generation failed', 
            reason: genErr.message,
            fallback: {
              daily_quote: "The first step to financial freedom is knowing your numbers. Sync your data to see your pulse.",
              projected_savings: 0,
              card_insights: [],
              health_explanation: "You haven't added any cards yet. Let's start building your financial profile!"
            }
          };
        }
      }

      return data[0];
    }, bypassCache ? 0 : 3600); // Bypass cache if nocache=true, else cache for 1 hour

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual AI generation
app.post('/api/ai/sync', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || 'default-user';
    const fresh = await syncAIInsights();
    
    // ✨ Invalidate daily insights cache after generation
    const cacheKey = `user:${userEmail}:daily_insights`;
    await deleteCache(cacheKey);
    console.log(`🔄 Invalidated cache: ${cacheKey}`);
    
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cron: Sync AI Insights every 24 hours at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Cron fired: Generating daily AI insights...');
  await syncAIInsights();
  
  // ✨ Invalidate all daily insights caches after generation
  await deleteCachePattern('user:*:daily_insights');
  console.log('🔄 Invalidated all daily_insights caches via pattern match');
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
    console.log('🔍 [Discover] Request received for email sync');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, google_refresh_token')
      .not('google_refresh_token', 'is', null)
      .limit(1); // For now, we discover for the first authenticated user found

    if (error) {
      console.error('❌ [Discover] DB error:', error.message);
      throw error;
    }
    
    console.log(`📧 [Discover] Found ${users?.length || 0} users with gmail token`);
    
    if (!users || users.length === 0) {
      console.warn('⚠️  [Discover] No authenticated user found. Please connect Gmail first.');
      return res.status(404).json({ error: 'No authenticated user found. Please connect Gmail first.' });
    }

    console.log(`🔄 [Discover] Starting email discovery...`);
    const result = await discoverCardsForUser(users[0]);
    
    console.log(`✅ [Discover] Discovery complete:`, result);
    res.json(result);
  } catch (err) {
    console.error('❌ Discovery error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Cards
app.get('/api/cards', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || 'default-user';
    const cacheKey = `user:${userEmail}:cards`;
    const bypassCache = req.query.nocache === 'true';

    const data = await getCachedData(cacheKey, async () => {
      const { data: cards, error } = await supabase.from('cards').select('*');
      if (error) throw error;
      return cards;
    }, bypassCache ? 0 : 600); // Bypass cache if nocache=true, else cache for 10 minutes

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const { cardName, bankName, last4Digits, cardType, creditLimit, userId, billingCycleDate, colorTheme } = req.body;
    const userEmail = req.headers['x-user-email'] || 'default-user';

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

    // Invalidate cards and summary cache
    await deleteCache(`user:${userEmail}:cards`);
    await deleteCache(`user:${userEmail}:summary`);

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cardName, bankName, last4Digits, cardType, billingCycleDate, colorTheme } = req.body;
    const userEmail = req.headers['x-user-email'] || 'default-user';

    const { data, error } = await supabase
      .from('cards')
      .update({ 
        cardname: cardName, 
        bankname: bankName, 
        last4digits: last4Digits,
        cardtype: cardType,
        billingcycledate: billingCycleDate || 1,
        colortheme: colorTheme
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    // ✅ Clear cache so edits appear immediately
    await deleteCache(`user:${userEmail}:cards`);
    await deleteCache(`user:${userEmail}:summary`);

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

    // Get bill with card details to find user email and create notification
    const bill = data[0];
    const userEmail = req.headers['x-user-email'] || 'default-user';

    // Invalidate summary cache when bill status changes
    await deleteCache(`user:${userEmail}:summary`);

    if (status === 'Paid' && bill?.cardid) {
      const { data: cardData } = await supabase
        .from('cards')
        .select('userid, cardname')
        .eq('id', bill.cardid)
        .limit(1);

      if (cardData?.[0]?.userid) {
        const userId = cardData[0].userid;
        const cardName = cardData[0].cardname;
        
        // Get user email from users table
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', userId)
          .limit(1);

        if (userData?.[0]?.email) {
          const realUserEmail = userData[0].email;
          
          // Create notification
          const notif = {
            useremail: realUserEmail,
            type: 'payment',
            icon: 'success',
            title: 'Payment Recorded',
            message: `Successfully recorded ₹${bill.amountdue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0'} payment for ${cardName}`,
            read: false,
            createdat: new Date().toISOString()
          };
          
          try {
            await supabase.from('notifications').insert([notif]);
            console.log(`✅ Payment notification created`);
          } catch (notifErr) {
            console.warn('Could not create notification:', notifErr.message);
          }
        }
      }
    }

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

// Chatbot API Endpoint — Powered by Gemini with Knowledge Base
app.post('/api/chatbot/ask', async (req, res) => {
  try {
    const { message, userEmail, conversationHistory = [] } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // ✅ Get current user ID first
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (!userData) {
      return res.status(401).json({ error: 'User not found. Please sign in with Gmail first.' });
    }

    const userId = userData.id;

    // Get user's cards (only their cards)
    const { data: cards } = await supabase
      .from('cards')
      .select('*')
      .eq('userid', userId);

    // Get user's bills (linked through their cards)
    const cardIds = (cards || []).map(c => c.id);
    let bills = [];
    if (cardIds.length > 0) {
      const { data: billData } = await supabase
        .from('bills')
        .select('*')
        .in('cardid', cardIds)
        .order('duedate', { ascending: true });
      bills = billData || [];
    }

    // Get user's expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('userid', userId)
      .limit(20);

    // Retrieve last 10 messages from chatbot history for context
    const { data: chatHistory } = await supabase
      .from('chatbot_history')
      .select('role, message, createdat')
      .eq('useremail', userEmail)
      .order('createdat', { ascending: false })
      .limit(10);

    const previousConversation = (chatHistory || [])
      .reverse()
      .map(msg => `${msg.role === 'user' ? 'User' : 'Lana'}: ${msg.message}`)
      .join('\n');

    // Calculate summary stats from YOUR bills
    const unpaidBills = bills.filter(b => b.status === 'Unpaid' || b.status === 'unpaid');
    const totalUnpaidAmount = unpaidBills.reduce((sum, b) => sum + (b.amountdue || b.amount_due || 0), 0);
    const nearestDueDate = unpaidBills.length > 0 
      ? unpaidBills.reduce((nearest, b) => {
          const bDate = new Date(b.duedate || b.due_date);
          const nDate = new Date(nearest.duedate || nearest.due_date);
          return bDate < nDate ? b : nearest;
        }).duedate || unpaidBills[0].due_date
      : null;

    // Format cards data for display
    const cardsSummary = (cards || []).map(c => ({
      name: c.cardname || c.card_name || 'Card',
      bank: c.bankname || c.bank_name || 'Unknown Bank',
      limit: c.creditlimit || c.credit_limit || 'Not set'
    }));

    // Format recent bills for display
    const recentBills = unpaidBills.slice(0, 3).map(b => ({
      amount: b.amountdue || b.amount_due,
      dueDate: new Date(b.duedate || b.due_date).toLocaleDateString('en-IN'),
      status: b.status || 'Unpaid'
    }));

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const prompt = `You are Lana, a friendly and knowledgeable financial assistant for a credit card management app.

PREVIOUS CONVERSATION CONTEXT:
${previousConversation || 'This is the start of the conversation.'}

CURRENT USER'S FINANCIAL CONTEXT:
- Total unpaid bills: ₹${totalUnpaidAmount?.toFixed(2) || '0'}
- Active cards: ${cardsSummary?.length || 0}
- Pending bills: ${unpaidBills?.length || 0}
- Nearest due date: ${nearestDueDate ? new Date(nearestDueDate).toLocaleDateString('en-IN') : 'N/A'}

Recent Bills: ${JSON.stringify(recentBills, null, 2)}

Cards: ${JSON.stringify(cardsSummary, null, 2)}

NEW USER MESSAGE: "${message}"

IMPORTANT INSTRUCTIONS:
- Reference the conversation history to maintain context and continuity
- Remember details the user mentioned in previous messages
- If they're asking follow-up questions, refer back to earlier points
- Provide personalized financial advice based on their actual data
- Keep responses concise (2-3 sentences max)
- Include specific numbers and card names when relevant
- Be supportive and encouraging
- Suggest actionable steps when appropriate
- Always respond in a friendly, conversational tone`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Save user message to history
    try {
      await supabase
        .from('chatbot_history')
        .insert([
          { useremail: userEmail, role: 'user', message: message.trim() }
        ]);
    } catch (err) {
      console.warn('⚠️ Could not save user message:', err.message);
    }

    // Save assistant response to history
    try {
      await supabase
        .from('chatbot_history')
        .insert([
          { useremail: userEmail, role: 'assistant', message: response }
        ]);
    } catch (err) {
      console.warn('⚠️ Could not save assistant message:', err.message);
    }



    res.json({ 
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error.message);
    res.status(500).json({ error: 'Failed to process chatbot request', details: error.message });
  }
});

// Get chatbot conversation history for a user
app.get('/api/chatbot/history/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const { data: chatHistory, error } = await supabase
      .from('chatbot_history')
      .select('id, role, message, createdat')
      .eq('useremail', userEmail)
      .order('createdat', { ascending: true })
      .limit(50);

    if (error) throw error;

    console.log(`📚 Chat history retrieved`);

    res.json({ 
      userEmail,
      messages: chatHistory || [],
      count: chatHistory?.length || 0
    });

  } catch (error) {
    console.error('❌ Get chatbot history error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve chatbot history', details: error.message });
  }
});

// Clear chatbot history (optional)
app.delete('/api/chatbot/history/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const { data, error } = await supabase
      .from('chatbot_history')
      .delete()
      .eq('useremail', userEmail);

    if (error) throw error;

    console.log(`🗑️ Chat history cleared`);

    res.json({ 
      message: 'Chatbot history cleared',
      deletedCount: data?.length || 0
    });

  } catch (error) {
    console.error('❌ Clear chatbot history error:', error.message);
    res.status(500).json({ error: 'Failed to clear chatbot history', details: error.message });
  }
});

// AI Suggestion Engine Placeholder
app.post('/api/suggestions', async (req, res) => {
  res.json({ message: 'AI Suggestion Engine endpoint ready to be implemented' });
});

// AI Agent: Extract and Save Card from Image
app.post('/api/chatbot/extract-card-from-image', async (req, res) => {
  try {
    const { imageBase64, userEmail } = req.body;

    // ✅ Security: Validate input
    if (!imageBase64 || !userEmail) {
      return res.status(400).json({ error: 'Image and user email are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // ✅ Security: Limit file size (base64 string size check)
    const fileSizeInBytes = Buffer.byteLength(imageBase64, 'utf-8');
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (fileSizeInBytes > maxSizeInBytes) {
      return res.status(413).json({ error: 'Image is too large (max 5MB)' });
    }

    // ✅ Security: Rate limiting - check upload count in last hour
    const { data: recentUploads } = await supabase
      .from('chatbot_history')
      .select('createdat')
      .eq('useremail', userEmail)
      .gt('createdat', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .filter('role', 'eq', 'card_extraction');

    const uploadCount = recentUploads?.length || 0;
    if (uploadCount >= 5) {
      return res.status(429).json({ error: 'Too many card uploads. Please try again in 1 hour.' });
    }

    console.log(`🔐 [AI Agent] Processing card image...`);

    // ✅ Use Gemini Vision API to extract card details
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });

    const extractionPrompt = `You are a secure card data extraction AI. Analyze this credit card image and extract the following information ONLY if visible:
    
    Return ONLY a valid JSON object with these fields:
    {
      "bankName": "extracted bank name or 'Unknown'",
      "cardName": "extracted card brand (Visa, Mastercard, RuPay, Amex, etc) or 'Unknown'",
      "last4Digits": "last 4 digits ONLY (e.g., '1234') - NEVER the full number",
      "expiryMonth": "expiry month as 2-digit number (e.g., '12') or null",
      "expiryYear": "expiry year as 4-digit number (e.g., '2025') or null",
      "holderName": "cardholder name or null",
      "isValidCard": true or false
    }
    
    SECURITY RULES:
    1. NEVER extract or return full card numbers
    2. Extract ONLY last 4 digits
    3. Only return numbers for expiry (no special characters)
    4. Validate the card looks legitimate before returning true for isValidCard
    5. If not a card image, set isValidCard to false
    6. Return null for any field you cannot confidently extract`;

    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '')
        }
      },
      { text: extractionPrompt }
    ]);

    const responseText = response.response.text();
    console.log(`📸 [AI Agent] Raw response:`, responseText);

    // Parse and validate extracted data
    let extractedData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(400).json({ error: 'Could not extract card information. This may not be a valid credit card image.' });
      }
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('❌ JSON parsing error:', parseErr.message);
      return res.status(400).json({ error: 'Failed to parse card data' });
    }

    // ✅ Security: Validate extracted data
    if (!extractedData.isValidCard) {
      return res.status(400).json({ error: 'The image does not appear to be a valid credit card. Please upload a clear card image.' });
    }

    if (!extractedData.last4Digits || extractedData.last4Digits.length !== 4 || !/^\d{4}$/.test(extractedData.last4Digits)) {
      return res.status(400).json({ error: 'Could not extract valid last 4 digits. Please ensure the card number is visible.' });
    }

    // ✅ Security: Get user from Supabase to verify email
    const { data: userData } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .single();

    if (!userData) {
      return res.status(401).json({ error: 'User not found. Please sign in first.' });
    }

    // ✅ Security: Sanitize inputs
    const sanitizedData = {
      userId: userData.id,
      bankName: (extractedData.bankName || 'Other').substring(0, 100),
      cardName: (extractedData.cardName || 'Unknown').substring(0, 100),
      last4Digits: extractedData.last4Digits.slice(-4),
      expiryMonth: extractedData.expiryMonth ? parseInt(extractedData.expiryMonth) : null,
      expiryYear: extractedData.expiryYear ? parseInt(extractedData.expiryYear) : null,
      holderName: extractedData.holderName ? extractedData.holderName.substring(0, 100) : null
    };

    // Validate expiry
    if (sanitizedData.expiryMonth && (sanitizedData.expiryMonth < 1 || sanitizedData.expiryMonth > 12)) {
      return res.status(400).json({ error: 'Invalid card expiry month' });
    }
    if (sanitizedData.expiryYear && (sanitizedData.expiryYear < 2020 || sanitizedData.expiryYear > 2050)) {
      return res.status(400).json({ error: 'Invalid card expiry year' });
    }

    // ✅ Check if card already exists (prevent duplicates)
    const { data: existingCard } = await supabase
      .from('cards')
      .select('id')
      .eq('userid', userData.id)
      .eq('last4digits', sanitizedData.last4Digits)
      .single();

    if (existingCard) {
      return res.status(409).json({ error: 'A card with this last 4 digits already exists in your account.' });
    }

    // ✅ Save card to database
    const { data: newCard, error: cardError } = await supabase
      .from('cards')
      .insert([
        {
          userid: userData.id,
          bankname: sanitizedData.bankName,
          cardname: sanitizedData.cardName,
          last4digits: sanitizedData.last4Digits,
          billingcycledate: 1 // Default: 1st of month (user can update later)
        }
      ])
      .select();

    if (cardError) {
      console.error('❌ Card save error:', cardError);
      return res.status(500).json({ error: 'Failed to save card to database' });
    }

    // ✅ Clear cache so the new card appears immediately
    await deleteCache(`user:${userEmail}:cards`);
    await deleteCache(`user:${userEmail}:summary`);

    // Log the action for audit trail
    try {
      await supabase
        .from('chatbot_history')
        .insert([
          {
            useremail: userEmail,
            role: 'card_extraction',
            message: `Card added via image: ${sanitizedData.bankName} ***${sanitizedData.last4Digits}`
          }
        ]);
    } catch (auditErr) {
      console.warn('⚠️ Audit log error:', auditErr.message);
    }

    console.log(`✅ [AI Agent] Card successfully saved`);

    res.json({
      success: true,
      message: `Card added successfully: ${sanitizedData.cardName} ending in ${sanitizedData.last4Digits}`,
      card: {
        id: newCard[0].id,
        bankName: sanitizedData.bankName,
        cardName: sanitizedData.cardName,
        last4Digits: sanitizedData.last4Digits
      }
    });

  } catch (error) {
    console.error('❌ Card extraction error:', error.message);
    res.status(500).json({ error: 'Failed to process card image', details: error.message });
  }
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
