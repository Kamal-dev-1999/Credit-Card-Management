const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Credit Card Management API is running' });
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cards
app.get('/api/cards', async (req, res) => {
  try {
    const cards = await prisma.card.findMany();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bills
app.get('/api/bills', async (req, res) => {
    try {
      const bills = await prisma.bill.findMany();
      res.json(bills);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
    try {
      const expenses = await prisma.expense.findMany();
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
