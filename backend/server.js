const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const supabase = require('./src/config/supabase');

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
