-- --------------------------------------------------------
-- Supabase SQL Schema for Credit Card Management App
-- Run this directly in the Supabase SQL Editor
-- --------------------------------------------------------

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  whatsappNumber TEXT,
  googleRefreshToken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cards Table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bankName TEXT NOT NULL,
  cardName TEXT NOT NULL,
  last4Digits TEXT NOT NULL,
  billingCycleDate INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bills Table
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cardId UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  amountDue DECIMAL(12, 2) NOT NULL,
  dueDate DATE NOT NULL,
  status TEXT DEFAULT 'Unpaid', -- "Unpaid" or "Paid"
  statementDate DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Expenses Table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS) policies if needed in the future, 
-- but they are disabled by default on new Supabase tables.
