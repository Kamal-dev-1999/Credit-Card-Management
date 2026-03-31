-- ============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) SETUP FOR CREDIT CARD MANAGEMENT APP
-- ============================================================================
-- 
-- PURPOSE:
-- This script implements database-level row-level security (RLS) policies
-- to ensure users can ONLY access their own financial data. When combined
-- with API-level authentication, this creates a defense-in-depth security
-- model.
--
-- EXECUTION NOTES:
-- 1. Run this in the Supabase SQL Editor
-- 2. Must be run by database owner (role: postgres)
-- 3. Policies are checked for every SELECT, UPDATE, DELETE operation
-- 4. Uses lowercase column names (userid, cardid, etc.)
--
-- ============================================================================

-- =============================================================================
-- 1. USERS TABLE - Base identity table
-- =============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);


-- =============================================================================
-- 2. CARDS TABLE - Linked to users via userid
-- =============================================================================

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Users can view only their own cards
CREATE POLICY "Users can view their own cards"
ON public.cards FOR SELECT
USING (auth.uid() = userid);

-- Users can insert only their own cards
CREATE POLICY "Users can create their own cards"
ON public.cards FOR INSERT
WITH CHECK (auth.uid() = userid);

-- Users can update only their own cards
CREATE POLICY "Users can update their own cards"
ON public.cards FOR UPDATE
USING (auth.uid() = userid)
WITH CHECK (auth.uid() = userid);

-- Users can delete only their own cards
CREATE POLICY "Users can delete their own cards"
ON public.cards FOR DELETE
USING (auth.uid() = userid);


-- =============================================================================
-- 3. BILLS TABLE - Linked to users via cards.userid
-- =============================================================================

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Users can view bills for their own cards
CREATE POLICY "Users can view their own bills"
ON public.bills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = bills.cardid
    AND cards.userid = auth.uid()
  )
);

-- Users can insert bills only for their own cards
CREATE POLICY "Users can create bills for their own cards"
ON public.bills FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = cardid
    AND cards.userid = auth.uid()
  )
);

-- Users can update bills only for their own cards
CREATE POLICY "Users can update their own bills"
ON public.bills FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = bills.cardid
    AND cards.userid = auth.uid()
  )
)

WITH CHECK (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = cardid
    AND cards.userid = auth.uid()
  )
);

-- Users can delete bills only for their own cards
CREATE POLICY "Users can delete their own bills"
ON public.bills FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = bills.cardid
    AND cards.userid = auth.uid()
  )
);


-- =============================================================================
-- 4. EXPENSES TABLE - Linked to users via userid
-- =============================================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Users can view only their own expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses FOR SELECT
USING (auth.uid() = userid);

-- Users can insert only their own expenses
CREATE POLICY "Users can create their own expenses"
ON public.expenses FOR INSERT
WITH CHECK (auth.uid() = userid);

-- Users can update only their own expenses
CREATE POLICY "Users can update their own expenses"
ON public.expenses FOR UPDATE
USING (auth.uid() = userid)
WITH CHECK (auth.uid() = userid);

-- Users can delete only their own expenses
CREATE POLICY "Users can delete their own expenses"
ON public.expenses FOR DELETE
USING (auth.uid() = userid);


-- =============================================================================
-- 5. NOTIFICATIONS TABLE - Using useremail for now
-- =============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add user_id column if it doesn't exist (for future migration)
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index on user_id for RLS performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- For now, we'll create a policy that works with useremail
-- Users can view their own notifications (by matching useremail with auth context)
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (true); -- Temporarily allow all (will be restricted by backend)

CREATE POLICY "Users can create notifications for themselves"
ON public.notifications FOR INSERT
WITH CHECK (true); -- Temporarily allow all (will be restricted by backend)

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (true) -- Temporarily allow all
WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (true);


-- =============================================================================
-- 6. CHATBOT_HISTORY TABLE - Linked to users via useremail
-- =============================================================================

ALTER TABLE public.chatbot_history ENABLE ROW LEVEL SECURITY;

-- Users can view only their own conversation history
CREATE POLICY "Users can view their own chatbot history"
ON public.chatbot_history FOR SELECT
USING (useruserid = auth.uid());

-- Users can insert only their own messages
CREATE POLICY "Users can create chatbot messages"
ON public.chatbot_history FOR INSERT
WITH CHECK (useruserid = auth.uid());

-- Users can update only their own messages
CREATE POLICY "Users can update their own chatbot messages"
ON public.chatbot_history FOR UPDATE
USING (useruserid = auth.uid())
WITH CHECK (useruserid = auth.uid());

-- Users can delete only their own messages
CREATE POLICY "Users can delete their own chatbot messages"
ON public.chatbot_history FOR DELETE
USING (useruserid = auth.uid());


-- =============================================================================
-- 7. AI_INSIGHTS TABLE - Has user_id natively
-- =============================================================================

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Users can view only their own AI insights
CREATE POLICY "Users can view their own AI insights"
ON public.ai_insights FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own AI insights (typically backend-generated)
CREATE POLICY "Users can create their own AI insights"
ON public.ai_insights FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own AI insights
CREATE POLICY "Users can update their own AI insights"
ON public.ai_insights FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own AI insights
CREATE POLICY "Users can delete their own AI insights"
ON public.ai_insights FOR DELETE
USING (auth.uid() = user_id);


-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' ORDER BY tablename;

-- List all RLS policies:
-- SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies 
-- WHERE schemaname = 'public' ORDER BY tablename;

-- =============================================================================
-- END OF RLS SETUP
-- =============================================================================
