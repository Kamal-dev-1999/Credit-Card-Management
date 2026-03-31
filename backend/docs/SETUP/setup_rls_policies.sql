-- ============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) SETUP FOR CREDIT CARD MANAGEMENT APP
-- ============================================================================
-- 
-- PURPOSE:
-- This script implements database-level row-level security (RLS) policies
-- to ensure users can ONLY access their own financial data. When combined
-- with API-level authentication, this creates a defense-in-depth security
-- model where database-level enforcement prevents unauthorized data access.
--
-- SECURITY PRINCIPLE:
-- Even if API authentication is bypassed or misconfigured, RLS policies
-- will prevent users from accessing other users' data at the database level.
--
-- EXECUTION NOTES:
-- 1. Run this in the Supabase SQL Editor
-- 2. Must be run by database owner (role: postgres)
-- 3. Policies are checked for every SELECT, UPDATE, DELETE operation
-- 4. INSERT policies grant write access only to own data (auth.uid())
-- 5. Disable RLS from UI: "Authentication" > "Policies" > toggle off if needed
--
-- ============================================================================

-- =============================================================================
-- 1. USERS TABLE - Base identity table (minimal RLS needed)
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

-- Note: INSERT is typically handled by auth triggers, so we don't restrict it here


-- =============================================================================
-- 2. CARDS TABLE - Linked to users via userId
-- =============================================================================

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Users can view only their own cards
CREATE POLICY "Users can view their own cards"
ON public.cards FOR SELECT
USING (
  auth.uid()::text = "userId"
);

-- Users can insert only their own cards
CREATE POLICY "Users can create their own cards"
ON public.cards FOR INSERT
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Users can update only their own cards
CREATE POLICY "Users can update their own cards"
ON public.cards FOR UPDATE
USING (
  auth.uid()::text = "userId"
)
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Users can delete only their own cards
CREATE POLICY "Users can delete their own cards"
ON public.cards FOR DELETE
USING (
  auth.uid()::text = "userId"
);


-- =============================================================================
-- 3. BILLS TABLE - Linked to users via cards.userId
-- =============================================================================

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Users can view bills for their own cards
CREATE POLICY "Users can view their own bills"
ON public.bills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = bills."cardId"
    AND cards."userId" = auth.uid()::text
  )
);

-- Users can insert bills only for their own cards
CREATE POLICY "Users can create bills for their own cards"
ON public.bills FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = "cardId"
    AND cards."userId" = auth.uid()::text
  )
);

-- Users can update bills only for their own cards
CREATE POLICY "Users can update their own bills"
ON public.bills FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = bills."cardId"
    AND cards."userId" = auth.uid()::text
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = "cardId"
    AND cards."userId" = auth.uid()::text
  )
);

-- Users can delete bills only for their own cards
CREATE POLICY "Users can delete their own bills"
ON public.bills FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM cards
    WHERE cards.id = bills."cardId"
    AND cards."userId" = auth.uid()::text
  )
);


-- =============================================================================
-- 4. EXPENSES TABLE - Linked to users via userId
-- =============================================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Users can view only their own expenses
CREATE POLICY "Users can view their own expenses"
ON public.expenses FOR SELECT
USING (
  auth.uid()::text = "userId"
);

-- Users can insert only their own expenses
CREATE POLICY "Users can create their own expenses"
ON public.expenses FOR INSERT
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Users can update only their own expenses
CREATE POLICY "Users can update their own expenses"
ON public.expenses FOR UPDATE
USING (
  auth.uid()::text = "userId"
)
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Users can delete only their own expenses
CREATE POLICY "Users can delete their own expenses"
ON public.expenses FOR DELETE
USING (
  auth.uid()::text = "userId"
);


-- =============================================================================
-- 5. NOTIFICATIONS TABLE - Currently uses useremail, needs migration to user_id
-- =============================================================================

-- Add user_id column if it doesn't exist
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Create index on user_id for RLS performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Migrate data from useremail to user_id (one-time operation)
-- This joins notifications with users table to populate user_id
UPDATE public.notifications n
SET user_id = u.id
FROM public.users u
WHERE n.useremail = u.email AND n.user_id IS NULL;

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view only their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (
  auth.uid() = user_id
);

-- Users can insert only their own notifications
CREATE POLICY "Users can create notifications for themselves"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Users can update only their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Users can delete only their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (
  auth.uid() = user_id
);


-- =============================================================================
-- 6. AI_INSIGHTS TABLE - Already has user_id and RLS in setup_ai_insights.sql
-- =============================================================================
-- 
-- NOTE: The ai_insights table already has RLS enabled via setup_ai_insights.sql
-- The policy "Users can see their own AI insights" is already in place.
-- No changes needed here.


-- =============================================================================
-- 7. VERIFICATION AND TESTING
-- =============================================================================

-- To verify RLS is enabled, run this query:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- To check which policies exist:
-- SELECT tablename, policyname, qual, with_check FROM pg_policies 
-- WHERE schemaname = 'public' ORDER BY tablename;

-- To test RLS, you can set the role to simulate a user:
-- SET ROLE authenticated; -- Assumes you have authenticated role
-- SELECT * FROM public.cards; -- Should only return cards for authenticated user


-- =============================================================================
-- 8. SECURITY NOTES
-- =============================================================================

/*

IMPORTANT SECURITY CONSIDERATIONS:

1. TYPE CASTING:
   - Cards and Expenses use "userId" (UUID stored as text)
   - RLS policies cast auth.uid()::text to compare with userId
   - If you migrate to native UUID columns, update policies to:
     WHERE auth.uid() = "userId" (without ::text cast)

2. JUNCTION TABLES:
   - Bills table is linked through cards foreign key
   - RLS on bills checks authorization through cards table
   - This prevents direct SQL access to bills from other users

3. NOTIFICATION MIGRATION:
   - Old column useremail is kept for backward compatibility
   - All new code should use user_id
   - Eventually deprecate useremail column

4. AUTH CONTEXT:
   - auth.uid() returns the UUID of the logged-in user
   - RLS policies check this value against user/user_id columns
   - Requires valid JWT token in request Authorization header

5. TESTING RLS:
   - Create test users with different UUIDs
   - Verify User A cannot access User B's data
   - Verify CRUD operations work only on own data
   - Run security tests: npm run test:all

6. PERFORMANCE:
   - Indexed columns: users.id, cards.userId, expenses.userId, 
                     bills.cardId, notifications.user_id, ai_insights.user_id
   - RLS adds JOIN overhead for nested policies (like bills)
   - Monitor query performance with SELECT * FROM user_stats

7. DEPLOYMENT ORDER:
   1. Run this migration script (setup_rls_policies.sql)
   2. Verify RLS is working with test queries
   3. Monitor API error rates (may see 403 Forbidden initially)
   4. Gradually roll out to production
   5. Keep old API responses compatible during transition

*/

-- =============================================================================
-- END OF RLS SETUP
-- =============================================================================
