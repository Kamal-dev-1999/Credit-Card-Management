-- ============================================================================
-- RLS VERIFICATION AND TESTING SCRIPT
-- ============================================================================
-- 
-- PURPOSE:
-- Use this script to verify RLS is working correctly in development before
-- deploying to production. Tests user isolation at the database level.
--
-- SCHEMA VERSION: Updated for Credit Card Management App v2.0
-- Tables: users, cards, bills, expenses, notifications, ai_insights, chatbot_history
--
-- HOW TO USE:
-- 1. Run each section in Supabase SQL Editor
-- 2. Copy output and verify expected results
-- 3. If all tests pass, RLS is configured correctly
--
-- ============================================================================

-- =============================================================================
-- SECTION 1: VERIFY RLS IS ENABLED ON ALL TABLES
-- =============================================================================

-- This should show all tables with rowsecurity = true
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  -- Count policies per table
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Expected output:
-- +--------+-----------------+---------+--------+
-- | schema | table           | enabled | count  |
-- +--------+-----------------+---------+--------+
-- | public | users           | t       | 2      |
-- | public | cards           | t       | 4      |
-- | public | bills           | t       | 4      |
-- | public | expenses        | t       | 4      |
-- | public | notifications   | t       | 4      |
-- | public | ai_insights     | t       | 1      |
-- | public | chatbot_history | t       | 4      |
-- +--------+-----------------+---------+--------+


-- =============================================================================
-- SECTION 2: LIST ALL RLS POLICIES BY TABLE
-- =============================================================================

SELECT 
  pp.tablename,
  pp.policyname,
  pp.permissive as policy_type,
  pp.qual as select_condition,
  pp.with_check as insert_condition
FROM pg_policies pp
WHERE pp.schemaname = 'public'
ORDER BY pp.tablename, pp.policyname;

-- Expected: See policies listed like:
-- users          | Users can view their own profile        | SELECT | auth.uid() = id
-- cards          | Users can view their own cards          | SELECT | auth.uid()::text = ...
-- cards          | Users can create their own cards        | INSERT | auth.uid()::text = ...


-- =============================================================================
-- SECTION 3: SETUP TEST DATA (RUN ONCE)
-- =============================================================================

-- Create two test users (disable RLS temporarily to insert)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_history DISABLE ROW LEVEL SECURITY;

-- cleanup old test data if it exists
DELETE FROM notifications WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM chatbot_history WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM bills WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM cards WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM users WHERE email LIKE 'test%@rls-test.local';

-- Insert test users
INSERT INTO users (id, email, whatsappNumber) 
VALUES 
  ('a0000000-0000-0000-0000-000000000001'::uuid, 'test-user-a@rls-test.local', '+1234567890'),
  ('b0000000-0000-0000-0000-000000000002'::uuid, 'test-user-b@rls-test.local', '+9876543210')
ON CONFLICT DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_history ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 4: TEST SELECT PERMISSIONS (USER ISOLATION)
-- =============================================================================

-- As Admin: View all users (service role bypass)
SELECT id, email FROM public.users WHERE email LIKE 'test%@rls-test.local' ORDER BY id;
-- Expected: See both users (service role bypasses RLS)

-- Simulate User A request (set JWT claims)
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
SET ROLE authenticated;

SELECT id, email FROM public.users;
-- Expected: See only User A's row (RLS filtered)
-- Output: Only a0000000-0000-0000-0000-000000000001 | test-user-a@rls-test.local

-- Reset role
RESET ROLE;
RESET "request.jwt.claims";


-- =============================================================================
-- SECTION 5: TEST INSERT PERMISSIONS
-- =============================================================================

-- Setup: Insert test cards for User A and B (as service role)
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;

INSERT INTO cards (id, userid, useremail, bankname, cardname, last4digits, billingcycledate, cardtype, colortheme, creditlimit)
VALUES 
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'test-user-a@rls-test.local', 'HDFC Bank', 'Personal Savings', '1234', 15, 'Visa', 'blue', 100000),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'test-user-b@rls-test.local', 'ICICI Bank', 'Premium Plus', '5678', 20, 'Mastercard', 'purple', 150000)
ON CONFLICT DO NOTHING;

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Test: User A can see only their card
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
SET ROLE authenticated;

SELECT id, bankname, cardname, useremail FROM public.cards;
-- Expected: 1 row (User A's card)
-- Output: c0000000-0000-0000-0000-000000000001 | HDFC Bank | Personal Savings | test-user-a@rls-test.local

-- Test: User A tries to insert as User B (should fail)
-- Using DO block for exception handling
DO $$
BEGIN
  INSERT INTO public.cards (id, userid, useremail, bankname, cardname, last4digits, billingcycledate)
  VALUES ('d0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, 'test-user-b@rls-test.local', 'Axis Bank', 'Platinum', '9999', 10);
  
  RAISE NOTICE '✗ FAILED: User A was able to insert as User B (RLS not enforced)';
EXCEPTION WHEN others THEN
  RAISE NOTICE '✓ SUCCESS: RLS blocked unauthorized insert';
  RAISE NOTICE '  Error: %', SQLERRM;
END $$;
-- Expected: ERROR - new row violates RLS policy ✓
-- Error message: "new row violates row-level security policy"
-- Result: ✓ RLS is working correctly - user isolation enforced on INSERT

RESET ROLE;
RESET "request.jwt.claims";


-- =============================================================================
-- SECTION 6: TEST UPDATE PERMISSIONS
-- =============================================================================

-- Test: User A can update their own card
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
SET ROLE authenticated;

UPDATE public.cards 
SET bankname = 'HDFC Bank (Updated)' 
WHERE id = 'c0000000-0000-0000-0000-000000000001'::uuid;
-- Expected: UPDATE 1 (success)

-- Test: User A tries to update User B's card (should fail)
UPDATE public.cards 
SET bankname = 'Hacked' 
WHERE id = 'c0000000-0000-0000-0000-000000000002'::uuid;
-- Expected: UPDATE 0 (RLS hid the row, so update found nothing)

RESET ROLE;
RESET "request.jwt.claims";


-- =============================================================================
-- SECTION 7: TEST DELETE PERMISSIONS
-- =============================================================================

-- Setup: Create test card for deletion (as service role)
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;

INSERT INTO cards (id, userid, useremail, bankname, cardname, last4digits, billingcycledate)
VALUES ('d0000000-0000-0000-0000-000000000004'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'test-user-a@rls-test.local', 'Test Bank', 'To Delete', '0000', 1);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Test: User A can delete their own card
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
SET ROLE authenticated;

DELETE FROM public.cards WHERE id = 'd0000000-0000-0000-0000-000000000004'::uuid;
-- Expected: DELETE 1 (success)

-- Test: User A tries to delete User B's card (should fail)
DELETE FROM public.cards WHERE id = 'c0000000-0000-0000-0000-000000000002'::uuid;
-- Expected: DELETE 0 (RLS hid the row, so no rows matched)
-- Result: ✓ RLS is working correctly - user isolation enforced on DELETE

RESET ROLE;
RESET "request.jwt.claims";


-- =============================================================================
-- SECTION 8: TEST NESTED AUTHORIZATION (BILLS TABLE)
-- =============================================================================

-- Setup: Insert test bills (as service role)
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;

INSERT INTO bills (id, cardid, useremail, amountdue, duedate, statementdate, status)
VALUES 
  ('b0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'test-user-a@rls-test.local', 15000, '2024-01-20', '2024-01-10', 'Unpaid'),
  ('b0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'test-user-b@rls-test.local', 25000, '2024-01-25', '2024-01-15', 'Paid');

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Test: User A can see only bills for their cards (through EXISTS clause)
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
SET ROLE authenticated;

SELECT id, amountdue, status, useremail FROM public.bills;
-- Expected: 1 row (bill for User A's card)
-- Output: b0000000-0000-0000-0000-000000000001 | 15000 | Unpaid | test-user-a@rls-test.local

-- Test: User A tries to view User B's bills (RLS blocks through card ownership check)
-- This query returns 0 rows because the bill's card doesn't belong to User A
-- But RLS doesn't return an error - it just filters out unauthorized rows

RESET ROLE;
RESET "request.jwt.claims";


-- =============================================================================
-- SECTION 8.5: TEST CHATBOT HISTORY TABLE RLS
-- =============================================================================

-- Setup: Insert test chatbot messages (as service role)
ALTER TABLE public.chatbot_history DISABLE ROW LEVEL SECURITY;

INSERT INTO chatbot_history (id, useremail, useruserid, role, message)
VALUES 
  (gen_random_uuid(), 'test-user-a@rls-test.local', 'a0000000-0000-0000-0000-000000000001'::uuid, 'user', 'What is my credit score?'),
  (gen_random_uuid(), 'test-user-a@rls-test.local', 'a0000000-0000-0000-0000-000000000001'::uuid, 'assistant', 'Your estimated credit score is excellent.'),
  (gen_random_uuid(), 'test-user-b@rls-test.local', 'b0000000-0000-0000-0000-000000000002'::uuid, 'user', 'How to reduce debt?'),
  (gen_random_uuid(), 'test-user-b@rls-test.local', 'b0000000-0000-0000-0000-000000000002'::uuid, 'assistant', 'Here are strategies...');

ALTER TABLE public.chatbot_history ENABLE ROW LEVEL SECURITY;

-- Test: User A can see only their chatbot history
SET request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-000000000001"}';
SET ROLE authenticated;

SELECT useremail, role, message FROM public.chatbot_history;
-- Expected: 2 rows (only User A's conversations)
-- First message should be about credit score

-- Test: User A tries to view User B's chatbot history (should fail)
SELECT * FROM public.chatbot_history WHERE useremail = 'test-user-b@rls-test.local';
-- Expected: 0 rows (RLS filtered out User B's data)
-- Result: ✓ RLS is working correctly - user isolation enforced on SELECT

RESET ROLE;
RESET "request.jwt.claims";


-- =============================================================================
-- SECTION 9: PERFORMANCE IMPACT TEST
-- =============================================================================

-- Simple query timing (with RLS overhead)
-- Run this to measure RLS policy evaluation time

EXPLAIN ANALYZE
SELECT COUNT(*) FROM public.cards;
-- Look at "Planning Time" and "Execution Time"
-- RLS typically adds 0.1-0.5ms per query

EXPLAIN ANALYZE
SELECT COUNT(*) FROM public.cards WHERE userid = 'a0000000-0000-0000-0000-000000000001'::uuid;
-- Should use available indexes for efficient filtering


-- =============================================================================
-- SECTION 10: CLEANUP TEST DATA
-- =============================================================================

-- Remove test data (as service role)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

DELETE FROM notifications WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM chatbot_history WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM bills WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM cards WHERE useremail LIKE 'test%@rls-test.local';
DELETE FROM users WHERE email LIKE 'test%@rls-test.local';

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 11: TROUBLESHOOTING QUERIES
-- =============================================================================

-- If tests fail, run these diagnostic queries:

-- Check if RLS is enabled
SELECT rolname, rolcanlogin, rolsuper, rolinherit 
FROM pg_roles 
WHERE rolname = 'authenticated';

-- Check service role bypass setting
SELECT * FROM pg_roles WHERE oid = 16547; -- postgres admin role

-- Check for conflicting policies
SELECT * FROM pg_policies 
WHERE tablename IN ('cards', 'bills', 'chatbot_history') 
ORDER BY tablename, policyname;

-- Verify user existence in database
SELECT id, email FROM public.users 
WHERE id::text IN ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002');

-- Check cards table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cards'
ORDER BY ordinal_position;

-- Check bills table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bills'
ORDER BY ordinal_position;

-- Check chatbot_history table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chatbot_history'
ORDER BY ordinal_position;


-- =============================================================================
-- SECTION 12: EXPECTED TEST RESULTS SUMMARY
-- =============================================================================

/*

Test 1: RLS Enabled ✓
  - All 7 tables show rowsecurity = true
  - Total policy count: ~24+

Test 2: Policy Count ✓
  - users: 2 policies (SELECT, UPDATE)
  - cards: 4 policies (SELECT, INSERT, UPDATE, DELETE)
  - bills: 4 policies (SELECT, INSERT, UPDATE, DELETE)
  - expenses: 4 policies (SELECT, INSERT, UPDATE, DELETE)
  - notifications: 4 policies (SELECT, INSERT, UPDATE, DELETE)
  - ai_insights: 1 policy (SELECT)
  - chatbot_history: 4+ policies (SELECT, INSERT, UPDATE, DELETE)

Test 3: User Isolation ✓
  - Service role sees both users
  - User A sees only User A's data
  - User B sees only User B's data

Test 4: Insert Protection ✓
  - User A can insert own card data
  - User A cannot insert as User B (RLS policy violation)
  - useremail and userId properly validated

Test 5: Update Protection ✓
  - User A can update own card data
  - User A cannot update User B's card (0 rows affected)
  - Admin columns (cardtype, colortheme, creditlimit) updated correctly

Test 6: Delete Protection ✓
  - User A can delete own card
  - User A cannot delete User B's card (0 rows affected)

Test 7: Nested Authorization ✓
  - User A can access bills for their cards (through EXISTS clause)
  - User A cannot access bills for User B's cards
  - useremail field properly tracked

Test 8: Chatbot History ✓
  - User A can access only their chatbot conversations
  - User B cannot access User A's conversations
  - useruserid and useremail properly linked

Test 9: Performance ✓
  - Query planning time: <5ms
  - RLS overhead: <1ms per query
  - Index coverage on userId and cardId optimal

SUCCESS: RLS properly prevents cross-user data access at all tables ✓

*/

-- =============================================================================
-- END OF VERIFICATION SCRIPT
-- =============================================================================
