# Security Hardening Implementation Guide - Tasks 1 & 2 Complete ✅

## Overview
Tasks 1 & 2 of the security hardening have been successfully implemented. The system now uses:
1. **AES-256-GCM encryption** for the Google Refresh Token at rest
2. **httpOnly, Secure, SameSite=Strict cookies** for session management
3. **JWT tokens** for authentication without exposing credentials in URLs
4. **Authentication Context** for secure frontend credential management

---

## Task 1: Data Encryption at Rest ✅

### Created Files:
- **backend/src/utils/encryption.js**
  - AES-256-GCM implementation using Node.js crypto module
  - Functions: `encrypt(plaintext)` and `decrypt(ciphertext)`
  - Supports PBKDF2 key derivation from ENCRYPTION_KEY environment variable

### Updated Files:
- **backend/src/controllers/auth.controller.js**
  - Imported `encrypt` function
  - Encrypts `google_refresh_token` before storing in users table
  - Log: `✅ Encrypted refresh token stored securely`

- **backend/src/services/gmailService.js**
  - Updated `createGmailClient()` to automatically decrypt tokens
  - Detects encrypted vs. plaintext tokens automatically
  - Handles legacy tokens gracefully

- **backend/sample.env**
  - Added `ENCRYPTION_KEY` template
  - Added `JWT_SECRET` template

### Implementation Details:

**How Encryption Works:**
1. User authenticates with Google OAuth
2. Google returns `refresh_token`
3. Server encrypts token using AES-256-GCM with random IV
4. Encrypted token stored in database as base64
5. When Gmail service needs token, it automatically decrypts it
6. Raw token never exists in logs or database

**Environment Setup Required:**
```bash
# Generate encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file:
ENCRYPTION_KEY="<output from above>"
JWT_SECRET="<generate with random bytes>"
```

---

## Task 2: Secure Session Management ✅

### Created Files:

1. **backend/src/utils/jwt.js**
   - JWT token generation: `generateToken(userId, email)`
   - JWT token verification: `verifyToken(token)`
   - 7-day token expiration
   - HS256 algorithm

2. **frontend/src/context/AuthContext.jsx**
   - `AuthProvider` component wrapping the app
   - `useAuth()` hook for accessing user email
   - Automatic user info fetching from `/api/auth/me`
   - Logout functionality with cookie clearing
   - Handles OAuth callback (URL param cleaning)

3. **Backend Route Files:**
   - `backend/src/routes/cards.routes.js` - GET/POST cards
   - `backend/src/routes/dashboard.routes.js` - Dashboard summary, bill status
   - `backend/src/routes/sync.routes.js` - Email parsing endpoint
   - `backend/src/routes/news.routes.js` - Financial news
   - `backend/src/routes/ai.routes.js` - AI insights

4. **backend/server.js** (Main Entry Point)
   - Express.js server initialization
   - Cookie parser middleware
   - CORS with credentials enabled
   - All API route mounting
   - Error handling

### Updated Files:

1. **backend/src/routes/auth.routes.js**
   - `GET /api/auth/google` - Initiates OAuth flow
   - `GET /api/auth/google/callback` - Handles OAuth callback
     - Returns httpOnly cookie with JWT
     - No email exposed in redirect URL
   - `GET /api/auth/me` - Get current user from token
   - `POST /api/auth/logout` - Clear cookie

2. **backend/package.json**
   - Added: `jsonwebtoken@^9.1.2`
   - Added: `cookie-parser@^1.4.6`

3. **frontend/src/main.jsx**
   - Wrapped app with `<AuthProvider>`

4. **frontend/src/App.jsx**
   - Imports `useAuth` hook
   - Uses `userEmail` from context instead of localStorage
   - Removed localStorage calls
   - Added `credentials: 'include'` to all fetch calls
   - Updated logout handler

5. **frontend/src/components/Header.jsx**
   - Uses `useAuth()` hook
   - Removed localStorage

6. **frontend/src/components/Sidebar.jsx**
   - Uses `useAuth()` hook
   - Removed localStorage
   - Removed state-based login tracking

7. **frontend/src/components/AddCardModal.jsx**
   - Uses `useAuth()` hook
   - Added `credentials: 'include'` to fetch

8. **frontend/src/components/GlobalChatbot.jsx**
   - Uses `useAuth()` hook
   - Added `credentials: 'include'` to all fetch calls
   - Removed all localStorage calls

### Implementation Architecture:

**Backend Cookie Flow:**
```
Browser OAuth Callback → /api/auth/google/callback
                              ↓
                    Create JWT from userId + email
                              ↓
                    Set httpOnly Cookie with JWT
                              ↓
                    Redirect to frontend (no email in URL)
```

**Frontend Auth Flow:**
```
App Mount → AuthProvider
                ↓
          Fetch /api/auth/me with cookies
                ↓
          Extract email from JWT in cookie
                ↓
          Store in Context (not localStorage)
                ↓
          All components use useAuth() hook
```

**Secure Fetch Pattern:**
```javascript
fetch(url, {
  credentials: 'include',  // Send cookies automatically
  headers: {
    'Content-Type': 'application/json'
    // Do NOT send email header anymore!
  }
})
```

---

## Security Improvements Made:

### ✅ Before:
- Pure text Google refresh token in database
- User email in localStorage (XSS vulnerability)
- User email exposed in URL redirect
- Email passed via headers to backend
- Session tied to localStorage (easy to forge)

### ✅ After:
- Encrypted refresh token (AES-256-GCM) at rest
- No sensitive data in localStorage
- Email hidden from URLs (secure redirect)
- No email in headers (JWT in httpOnly cookie instead)
- Session tied to signed JWT in secure cookie
- Cookie flags:
  - `httpOnly`: Cannot be accessed by JavaScript
  - `secure`: Only sent over HTTPS (production)
  - `sameSite=strict`: Prevents CSRF attacks

---

## Installation & Setup Instructions:

### 1. Backend Setup:

```bash
cd backend
npm install  # Installs jsonwebtoken and cookie-parser

# Generate encryption key
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secret
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Update .env file with both values
```

### 2. Start Backend:
```bash
npm run dev  # or: npm start
```

### 3. Frontend - No Installation Needed:
The frontend changes are pure JavaScript/React. Just restart the dev server:

```bash
cd frontend
npm run dev  # Clear browser cache if needed
```

---

## Testing the Implementation:

### 1. Test OAuth Flow:
1. Fresh browser, navigate to http://localhost:5173
2. Click "Sign In"
3. Complete Google OAuth
4. Check DevTools → Application → Cookies:
   - Should see `auth_token` cookie
   - Should be marked as `HttpOnly`
   - Should NOT be accessible from JS console

### 2. Test Encrypted Token:
```bash
# In backend logs, you should see:
✅ Encrypted refresh token stored securely
```

### 3. Test Gmail Sync Still Works:
1. After login, trigger email sync
2. Check logs for:
   ```
   ✅ [Gmail] Refresh token decrypted successfully
   🔍 Searching Gmail with query...
   ```

### 4. Test LocalStorage is Gone:
1. Open DevTools → Application → LocalStorage
2. `lana_user_email` should NOT exist

### 5. Test Credentials Automatic:
1. DevTools → Network tab
2. Any API call should auto-include `Cookie: auth_token=...`
3. No need to pass email manually

---

## Remaining Tasks:

### Task 3: API Protection Middleware (Next)
- [ ] Install `helmet` for security headers
- [ ] Install `express-rate-limit` for rate limiting
- [ ] Add `/api/auth` and `/api/sync` rate limits (5 req/min)
- [ ] Add CORS refinement

### Task 4: Input Validation & Sanitization (After Task 3)
- [ ] Install `zod` for schema validation
- [ ] Create validation schemas for POST routes
- [ ] Return 400 errors for invalid input

### Task 5: Data Minimization & Privacy (After Task 4)
- [ ] Remove raw email logs from gmailService.js
- [ ] Clear email from memory after parsing

### Task 6: Supabase RLS Policies (Final)
- [ ] Generate SQL for row-level security
- [ ] Ensure data isolation per user

---

## Production Deployment Checklist:

Before deploying to production:

- [ ] Set `NODE_ENV=production` in .env
- [ ] Set `ENCRYPTION_KEY` to strong random value
- [ ] Set `JWT_SECRET` to strong random value
- [ ] Enable `secure: true` flag on cookies (requires HTTPS)
- [ ] Update CORS whitelist to production domain
- [ ] Enable rate limiting on all public endpoints
- [ ] Set up monitoring for failed JWT verifications
- [ ] Backup and secure database encryption key
- [ ] Configure HTTPS/SSL certificates

---

## Rollback Instructions (if needed):

If you need to support old plaintext tokens during migration:

The decrypt function in `gmailService.js` already handles this:
```javascript
// Automatically detects and falls back to plaintext tokens
if (refreshToken.length > 50 && !/^[A-Za-z0-9_-]+$/.test(refreshToken)) {
  decryptedToken = decrypt(refreshToken);
} else {
  decryptedToken = refreshToken; // Use as-is for plaintext
}
```

No code changes needed - it's already backward compatible!

---

## Support & Troubleshooting:

### Issue: "ENCRYPTION_KEY environment variable is not set"
**Solution:** Add `ENCRYPTION_KEY` to your `.env` file

### Issue: "Invalid or expired token"
**Solution:** Clear browser cookies and sign in again

### Issue: Gmail sync fails after updating
**Solution:** Check logs for "Decryption failed". Might be old plaintext token - resync with a fresh login.

### Issue: CORS errors after updating
**Solution:** Frontend must be at `http://localhost:5173` - ensure vite server is running

---

## Next Steps:

1. ✅ **Install new packages**: `npm install` in backend
2. ✅ **Update environment**: Add `ENCRYPTION_KEY` and `JWT_SECRET` to `.env`
3. ✅ **Restart servers**: Both backend and frontend
4. ✅ **Test OAuth flow**: Complete sign-in process
5. ⏳ **Move to Task 3**: API protection with helmet & rate limiting

