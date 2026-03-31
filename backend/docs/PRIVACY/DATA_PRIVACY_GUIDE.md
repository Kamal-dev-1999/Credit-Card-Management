/**
 * DATA PRIVACY & SECURITY GUIDELINES
 * 
 * This document outlines how sensitive data (emails, financial info, PII) 
 * should be handled throughout the application.
 */

// ══════════════════════════════════════════════════════════════════════════════
// SENSITIVE DATA CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * LEVEL 1: HIGHLY SENSITIVE (Never log, clear immediately)
 * - Raw email body content
 * - Full credit card numbers (only keep last 4)
 * - Excel sheets with account details
 * - PDF statement contents
 * - Bank account numbers
 * - Social security numbers
 * - CVV/CVC codes
 * 
 * HANDLING:
 * ❌ NEVER: Log to console, include in error messages, store in variables
 * ✅ ALWAYS: Clear from memory after extraction, use null/delete
 */

/**
 * LEVEL 2: SENSITIVE (Be careful with logging)
 * - User email addresses
 * - Full names
 * - Phone numbers
 * - Billing dates and amounts
 * - Transaction history
 * 
 * HANDLING:
 * ⚠️  Only log if necessary for debugging
 * ✅ Use context markers: "User: {email}" not full data
 * ✅ Exclude from error responses sent to client
 */

/**
 * LEVEL 3: SAFE (Can log normally)
 * - Aggregated statistics
 * - Error codes and messages (sanitized)
 * - Feature flags
 * - Application state (non-user data)
 */

// ══════════════════════════════════════════════════════════════════════════════
// CURRENT PRIVACY IMPLEMENTATIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 1. gmailService.js
 * -------------------
 * ✅ Extracts email body from Gmail API
 * ✅ Notes to controller to clear body after parsing
 * ✅ Deletes `detail` object after processing to free memory
 */

/**
 * 2. parserRules.js
 * -----------------
 * ✅ Extracts only needed fields (amounts, dates, last4)
 * ✅ Clears rawBody variable after extraction (rawBody.length = 0)
 * ✅ Never logs the full body content
 */

/**
 * 3. sync.controller.js & discover.controller.js
 * -----------------------------------------------
 * ✅ Sets email.body = null after processEmail()
 * ✅ Prevents body from being stored in logs or error contexts
 */

/**
 * 4. Error Handling
 * -----------------
 * ✅ Validation errors don't expose raw input data
 * ✅ Database errors sanitized before returning to client
 * ✅ Email addresses masked in logs (optional: last-20-chars-of-domain)
 */

// ══════════════════════════════════════════════════════════════════════════════
// BEST PRACTICES FOR DEVELOPERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * When working with email data:
 * 
 * GOOD:
 * console.log(`Processing email from bank: ${parsed.bankName}`);
 * console.log(`Extracted amount: ₹${parsed.amountDue}`);
 * 
 * BAD:
 * console.log(`Email body: ${email.body}`);
 * console.log(`Full email object:`, JSON.stringify(email));
 * return res.json({ error: 'Parse failed', raw_email: email.body });
 */

/**
 * When handling errors:
 * 
 * GOOD:
 * catch (err) {
 *   console.error('Email parsing failed:', err.message);
 *   res.status(500).json({ error: 'Failed to process email' });
 * }
 * 
 * BAD:
 * catch (err) {
 *   console.error('Error:', err, email);  // Logs full email!
 *   res.status(500).json({ error: err.message, email });  // Sends raw data!
 * }
 */

/**
 * When storing/caching:
 * 
 * GOOD:
 * const cacheKey = `bills:${user.id}`;
 * cache.set(cacheKey, { count: 5, total: 15000 });
 * 
 * BAD:
 * cache.set(user.id, email);  // Email body stays in Redis!
 * cache.set(`email:${emailId}`, fullEmailObject);
 */

/**
 * When returning responses:
 * 
 * GOOD:
 * res.json({ 
 *   bankName: parsed.bankName,
 *   last4digits: parsed.last4Digits,
 *   amountDue: parsed.amountDue,
 *   dueDate: parsed.dueDate
 * });
 * 
 * BAD:
 * res.json(email);  // Returns body and all headers!
 * res.json({ ...parsed, body: email.body });  // Includes full email!
 */

// ══════════════════════════════════════════════════════════════════════════════
// AUDIT CHECKLIST
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Use this checklist when adding new features:
 * 
 * [ ] Does the feature handle email bodies? If yes:
 *     [ ] Clear body after extraction (email.body = null)
 *     [ ] Never log full body content
 *     [ ] Never include in error messages
 *     [ ] Never cache raw body
 * 
 * [ ] Does the feature handle user data? If yes:
 *     [ ] Validate input with Zod before processing
 *     [ ] Mask sensitive fields in logs (first-char + *****)
 *     [ ] Error messages don't expose raw input
 *     [ ] Response only includes needed fields
 * 
 * [ ] Does the feature use console.log? If yes:
 *     [ ] Check for email bodies, PII, financial data
 *     [ ] Use context identifiers (email hash, user ID) not full data
 *     [ ] Test that logs are safe with real data
 * 
 * [ ] Database queries include user_id filter?
 *     [ ] RLS policies enforce row-level security
 *     [ ] No cross-user data access possible
 */

// ══════════════════════════════════════════════════════════════════════════════
// FUTURE IMPROVEMENTS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Phase 6: Database RLS Policies
 * - Add user_id columns to all tables
 * - Create RLS policies: auth.uid() == user_id
 * - Test cross-user access is blocked
 * 
 * Phase 7: Audit Logging
 * - Log user actions without sensitive data
 * - Track data access for compliance
 * - Implement data retention policies
 * 
 * Phase 8: Encryption at Rest
 * - Currently only JWT tokens encrypted
 * - Consider encrypting email content in database
 * - Add encryption keys rotation
 */

module.exports = {
  SENSITIVE_DATA_LEVELS: {
    LEVEL_1_HIGHLY_SENSITIVE: [
      'emailBody',
      'creditCardNumber',
      'bankAccountNumber',
      'cvvCode'
    ],
    LEVEL_2_SENSITIVE: [
      'userEmail',
      'fullName',
      'phoneNumber',
      'billingDate',
      'transactionHistory'
    ],
    LEVEL_3_SAFE: [
      'aggregatedStats',
      'errorCodes',
      'featureFlags',
      'appState'
    ]
  },

  PRIVACY_CHECKLIST: [
    'Clear email bodies after extraction',
    'Never log full email content',
    'Validate all user input with Zod',
    'Mask sensitive fields in logs',
    'Don\'t include raw data in error responses',
    'Test data privacy with real data',
    'Use RLS policies for database access',
    'Implement audit logging'
  ]
};
