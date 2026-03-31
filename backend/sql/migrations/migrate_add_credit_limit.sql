-- Migration: Add creditLimit column to cards table
-- Run this in Supabase SQL Editor if you want to track credit limits in the future

ALTER TABLE public.cards 
ADD COLUMN creditlimit DECIMAL(12, 2) DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_creditlimit ON public.cards(creditlimit);

-- Optional: Add updated_at timestamp for tracking changes
ALTER TABLE public.cards 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update creditlimit for existing cards (optional - set your own limits)
-- UPDATE public.cards SET creditlimit = 100000 WHERE creditlimit = 0;
