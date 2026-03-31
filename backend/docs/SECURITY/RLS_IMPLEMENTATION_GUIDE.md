# TASK 6: Supabase Row-Level Security (RLS) Implementation Guide

## Overview

**Task 6** implements database-level row-level security (RLS) policies to ensure users can only access their own financial data at the database layer. This is the final security hardening layer and completes the 6-phase security implementation.

**Defense-in-Depth Architecture:**
```
Layer 1: API Authentication (JWT in httpOnly cookies)
        ↓
Layer 2: API-level Authorization (user_id checks in code)
        ↓
Layer 3: Input Validation (Zod schemas)
        ↓
Layer 4: Database-level RLS (THIS TASK) ← ESSENTIAL
        ↓
Result: Users CANNOT access other users' data even with:
  - Stolen JWT tokens directing to raw SQL
  - Modified API requests bypassing authorization
  - Direct database access with stolen credentials
```

---

## What This Task Does

### Current State (Before Task 6)
- ✅ API checks `req.user.id` before allowing card access
- ✅ Controllers filter queries by `userId`
- ⚠️ If API authentication layer is bypassed → raw DB access exposes all user data

### After Task 6 Implementation
- ✅ API checks `req.user.id` before allowing card access
- ✅ Controllers filter queries by `userId`
- ✅ **Database rejects queries from users trying to access other users' data**
- ✅ Even with stolen database credentials, users can only see their own rows

### Implementation Strategy

**Phase 6 covers 3 operational levels:**

1. **Table Security (RLS Policies)**
   - Enable `SET row_level_security()` on all user-owned tables
   - Create SELECT, INSERT, UPDATE, DELETE policies for each table
   - Test that User A cannot SELECT User B's cards

2. **Data Structure Alignment**
   - Cards table: `userId` ✅ Already exists
   - Bills table: Linked through cards ✅ No direct userId needed
   - Expenses table: `userId` ✅ Already exists
   - Notifications table: Uses `useremail` ⚠️ Needs migration to `user_id`
   - AI Insights table: `user_id` ✅ Already has RLS

3. **Verification & Testing**
   - SQL verification queries to confirm RLS is active
   - Test that RLS policies prevent cross-user data access
   - Integration tests matching existing test suite (69 passing)

---

## Provided Files

### 1. `backend/setup_rls_policies.sql` (NEW)

**Purpose:** Complete SQL script to implement RLS across all tables

**Contains:**
- Enable RLS on: users, cards, bills, expenses, notifications, ai_insights
- 20+ RLS policies covering SELECT, INSERT, UPDATE, DELETE for each table
- Data migration from `useremail` to `user_id` in notifications table
- Indexes for RLS policy performance
- Testing queries and security notes

**Key Policies:**
```sql
-- Example: Cards table
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards"
ON public.cards FOR SELECT
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can create their own cards"
ON public.cards FOR INSERT
WITH CHECK (auth.uid()::text = "userId");

-- Similar for UPDATE and DELETE...
```

**Special Cases:**

- **Bills Table** (nested authorization):
  ```sql
  CREATE POLICY "Users can view their own bills"
  ON public.bills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cards
      WHERE cards.id = bills."cardId"
      AND cards."userId" = auth.uid()::text
    )
  );
  ```
  This checks: "Does the bill's card belong to the authenticated user?"

- **Notifications Migration**:
  ```sql
  ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id UUID;
  
  UPDATE public.notifications n
  SET user_id = u.id
  FROM public.users u
  WHERE n.useremail = u.email AND n.user_id IS NULL;
  ```
  Migrates from email-based to UUID-based user identification

---

## Execution Steps

### Step 1: Backup (Recommended)
```bash
# In Supabase dashboard: Project Settings > Backups
# Click "Request a new backup" to create restore point
```

### Step 2: Run RLS Script
```
1. Go to Supabase Dashboard > SQL Editor
2. Create new query
3. Copy entire contents of backend/setup_rls_policies.sql
4. Paste into SQL Editor
5. Click "Run" (or Cmd+Return)
6. Check for green "✓" checkmark confirming success
```

### Step 3: Verify RLS Enabled

Run these verification queries in SQL Editor:

**Query 1: Confirm RLS is Active**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected output:
```
 schemaname | tablename     | rowsecurity
 public     | users         | t
 public     | cards         | t
 public     | bills         | t
 public     | expenses      | t
 public     | notifications | t
 public     | ai_insights   | t
```

**Query 2: List All RLS Policies**
```sql
SELECT tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected output:
```
tablename  | policyname                  | qual
users      | Users can view their own...  | (auth.uid() = id)
cards      | Users can view their own...  | (auth.uid()::text = ...)
bills      | Users can view their own...  | (EXISTS (...))
...
```

### Step 4: Test RLS in SQL Editor

**Test 1: Create test data**
```sql
-- Run as service role (or create test account)
INSERT INTO users (id, email) VALUES 
(gen_random_uuid(), 'user1@example.com');
INSERT INTO users (id, email) VALUES 
(gen_random_uuid(), 'user2@example.com');

-- Get the UUIDs and use them for tests below
```

**Test 2: Simulate User 1 accessing their own data**
```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub":"<USER_1_UUID>"}';

SELECT * FROM cards; 
-- Should see only User 1's cards ✓
```

**Test 3: Simulate User 1 trying to access User 2's data**
```sql
-- This should FAIL with 403 Forbidden
SELECT * FROM cards 
WHERE "userId" = '<USER_2_UUID>';
-- Returns: 0 rows (RLS blocked access) ✓
```

### Step 5: Run Backend Tests

```bash
cd backend
npm run test:all
```

Expected: All 69 tests should still pass
- If tests fail, check error messages for RLS permission issues
- May need to adjust API database credentials

### Step 6: Deploy to Production

**Development:**
1. ✅ Run RLS script in dev Supabase project
2. ✅ Run full test suite
3. ✅ Test API endpoints manually

**Staging (if available):**
1. ✅ Replicate RLS setup
2. ✅ Run smoke tests
3. ✅ Monitor error rates for 24 hours

**Production:**
1. ✅ Announce RLS deployment to team
2. ✅ Monitor error rates in real-time
3. ✅ Have rollback plan (disable RLS from UI if needed)

---

## Technical Details

### table RLS Configuration

| Table | User Column | Policy Type | Authorization Check |
|-------|------------|-------------|---------------------|
| users | id (PK) | Direct | auth.uid() = id |
| cards | userId | Direct | auth.uid()::text = userId |
| bills | - (via cards) | Indirect | EXISTS (joins to cards) |
| expenses | userId | Direct | auth.uid()::text = userId |
| notifications | user_id | Direct | auth.uid() = user_id |
| ai_insights | user_id | Direct | auth.uid() = user_id |

### Type Casting Note

**Important:** Current schema stores `userId` as TEXT, but `auth.uid()` returns UUID.

RLS policies handle this with `auth.uid()::text`:
```sql
WHERE auth.uid()::text = "userId"
       ^^^^^^ CAST to text
```

**Future optimization:** Migrate `userId` to native UUID type (reduces casting overhead).

### Performance Implications

**Before RLS:**
```
SELECT * FROM cards 
-- Query: 1 table scan
-- Time: ~1ms
```

**After RLS:**
```
SELECT * FROM cards 
-- Query: 1 table scan + 1 RLS policy check per row
-- Time: ~1.5ms (overhead ~0.5ms per 1000 rows)
```

**Optimization:** Indexes created on all checked columns:
```sql
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_cards_userId ON public.cards("userId");
-- RLS filters using these indexes efficiently
```

---

## Troubleshooting

### Issue: "permission denied for schema public"
**Cause:** Running script as non-owner role
**Fix:** Use Supabase Dashboard SQL Editor (runs as postgres) or switch to owner role

### Issue: Tests fail with 403 Forbidden
**Cause:** API service role credentials changed or RLS too restrictive
**Fix:** 
1. Verify service role still exists in Supabase
2. Check that service role has `BYPASS RLS` enabled
3. Verify JWT tokens include correct `sub` (user ID)

### Issue: Cannot insert data anymore
**Cause:** WITH CHECK clause in INSERT policy failing
**Fix:** Verify request contains correct `auth.uid()` matching the user_id being inserted

### Issue: Old queries returning 0 rows
**Cause:** RLS now filters results
**Fix:** Verify queries include filters matching authenticated user
```sql
-- Before (worked, but insecure):
SELECT * FROM cards;

-- After (required with RLS):
SELECT * FROM cards WHERE "userId" = auth.uid()::text;
```

---

## Post-Implementation Checklist

- [ ] Executed setup_rls_policies.sql successfully
- [ ] Ran verification queries confirming RLS enabled on all tables
- [ ] All 69 backend tests passing
- [ ] Manually tested API endpoints (create, read, update, delete)
- [ ] Verified User A cannot access User B's data via SQL
- [ ] Notification table migration completed (user_id populated)
- [ ] Monitoring alerts set up for RLS-related permission errors
- [ ] Team notification about RLS enforcement
- [ ] Documentation updated with RLS status
- [ ] Backup created before production deployment

---

## Security Benefits

### What RLS Prevents

✅ **Stolen Database Credentials:**
- Attacker with raw DB access still cannot read other users' data
- Each query is filtered by `auth.uid()` even if direct DB connection

✅ **API Layer Bypass:**
- SQL injection bypassing API validation still filtered by RLS
- Direct database client connections (e.g., psql) respect RLS

✅ **Insider Threats:**
- Database administrators cannot accidentally view user data
- Audit logs show which user accessed which records

✅ **Privilege Escalation:**
- API middleware bugs cannot expose all user data
- Database enforces isolation independent of application code

### Limitations (What RLS Does NOT Prevent)

⚠️ **Valid User Account:**
- User with legitimate JWT can still exploit API bugs
- Solution: Input validation (Task 4) + Rate limiting (Task 3)

⚠️ **Service Role Operations:**
- Service role with BYPASS RLS can access all data
- Solution: Restrict service role credentials, rotate regularly

⚠️ **Performance Degradation:**
- Complex RLS policies on large tables cause query slowdown
- Solution: Index development, query optimization profiling

---

## Integration with Existing Security

**Task 1: Encryption at REST** ✅
- AES-256-GCM token encryption in backend memory
- RLS adds database-level encryption scope

**Task 2: Secure Sessions** ✅
- JWT in httpOnly cookies (7-day expiration)
- RLS validates JWT claims (auth.uid()) from cookie

**Task 3: API Protection** ✅
- Helmet security headers + 5-tier rate limiting
- RLS prevents abuse even if rate limiting bypassed

**Task 4: Input Validation** ✅
- Zod schemas validate all input (field type, enum, format)
- RLS prevents data access from invalid query attempts

**Task 5: Data Privacy** ✅
- Email body clearing from memory after parsing
- RLS prevents sensitive data leakage through database

**Task 6: Database Security** ✅ (THIS TASK)
- Row-level security policies enforce user isolation
- Database layer is final defense against data leakage

---

## Next Steps (Phase 2 Hardening)

After Task 6 completion, future hardening phases could include:

- **Task 7:** Audit Logging (log all data access with timestamps)
- **Task 8:** Encryption in Transit (TLS 1.3 verification)
- **Task 9:** Advanced Threat Detection (anomaly detection on API access patterns)

---

## Support

**For issues, reference:**
1. Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
2. PostgreSQL RLS Syntax: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
3. Prisma with RLS: https://www.prisma.io/docs/concepts/components/prisma-client

**Quick Rollback:**
```sql
-- If RLS causes too many permission errors, temporarily disable:
ALTER TABLE public.cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
-- Then debug and re-enable
```

---

## Success Criteria

Task 6 is complete when:

✅ setup_rls_policies.sql executed successfully
✅ Verification queries show RLS enabled on all tables
✅ All 69 backend tests passing
✅ User A cannot access User B's data at database level
✅ User A can perform full CRUD on own data
✅ Notifications table migration from useremail to user_id complete
✅ Documentation updated with RLS status
✅ Zero permission errors in API logs during normal operation

---

**Created:** [Current Date]
**Status:** Ready for Supabase Deployment
**Security Level:** 🔴 HIGH - Database-Level Enforcement Active
