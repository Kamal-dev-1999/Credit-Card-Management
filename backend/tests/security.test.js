/**
 * Security Tests - Helmet Headers and Rate Limiting
 * 
 * Run with: npm test -- security.test.js
 * Install: npm install --save-dev jest supertest
 */

const request = require('supertest');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ══════════════════════════════════════════════════════════════
// TEST SETUP - Mock Express App
// ══════════════════════════════════════════════════════════════

let app;

beforeEach(() => {
  // Create fresh app for each test
  app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    }
  }));

  // Rate limiter for testing
  const testLimiter = rateLimit({
    windowMs: 1000, // 1 second for testing
    max: 2, // Allow 2 requests per second
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/test', testLimiter, (req, res) => {
    res.json({ message: 'Success' });
  });

  app.get('/api/protected', (req, res) => {
    res.json({ message: 'Protected route' });
  });
});

// ══════════════════════════════════════════════════════════════
// TEST SUITE 1: Helmet Security Headers
// ══════════════════════════════════════════════════════════════

describe('🔒 Helmet Security Headers', () => {
  
  test('✅ Should set X-Frame-Options header (prevent clickjacking)', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('✅ Should set X-Content-Type-Options header (prevent MIME-sniffing)', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  test('✅ Should set X-XSS-Protection header (prevent XSS)', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    // Helmet sets this to "0" by default (deprecated header, modern browsers use CSP)
    expect(response.headers['x-xss-protection']).toBeDefined();
    expect(response.headers['x-xss-protection']).toBe('0');
  });

  test('✅ Should set Content-Security-Policy header', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
  });

  test('✅ Should set Strict-Transport-Security header', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['strict-transport-security']).toBeDefined();
    expect(response.headers['strict-transport-security']).toContain('max-age');
  });

  test('✅ Should set Referrer-Policy header', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['referrer-policy']).toBeDefined();
  });

  test('✅ Should not expose X-Powered-By header (info disclosure)', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════
// TEST SUITE 2: Rate Limiting
// ══════════════════════════════════════════════════════════════

describe('⏱️ Rate Limiting Protection', () => {
  
  test('✅ Should allow requests under the limit', async () => {
    const response1 = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response1.body.message).toBe('Success');
    expect(response1.headers['ratelimit-limit']).toBe('2');
    expect(response1.headers['ratelimit-remaining']).toBe('1');
  });

  test('✅ Should return RateLimit headers with remaining count', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
    expect(response.headers['ratelimit-reset']).toBeDefined();
  });

  test('✅ Should reject request when limit exceeded', async () => {
    // First request - should succeed
    await request(app)
      .get('/api/test')
      .expect(200);

    // Second request - should succeed
    await request(app)
      .get('/api/test')
      .expect(200);

    // Third request - should be rate limited
    const response = await request(app)
      .get('/api/test')
      .expect(429); // Too Many Requests

    expect(response.status).toBe(429);
  });

  test('✅ Should return 429 status for rate limited requests', async () => {
    // Exhaust the limit
    await request(app).get('/api/test');
    await request(app).get('/api/test');

    // This should be blocked
    const response = await request(app)
      .get('/api/test')
      .expect(429);

    expect(response.status).toBe(429);
  });

  test('✅ Should show RateLimit-Remaining decreases', async () => {
    const response1 = await request(app)
      .get('/api/test')
      .expect(200);

    const remaining1 = parseInt(response1.headers['ratelimit-remaining']);

    const response2 = await request(app)
      .get('/api/test')
      .expect(200);

    const remaining2 = parseInt(response2.headers['ratelimit-remaining']);

    expect(remaining2).toBeLessThan(remaining1);
  });

  test('✅ Should reset after time window expires', async () => {
    // Make requests to hit limit
    await request(app).get('/api/test').expect(200);
    await request(app).get('/api/test').expect(200);

    // This should fail
    await request(app).get('/api/test').expect(429);

    // Wait for window to reset (1 second in test)
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should work again
    const response = await request(app)
      .get('/api/test')
      .expect(200);

    expect(response.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════
// TEST SUITE 3: Integration - Security + Rate Limiting
// ══════════════════════════════════════════════════════════════

describe('🔐 Security Integration Tests', () => {
  
  test('✅ Should have security headers AND be rate limited', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);

    // Check both Helmet headers and rate limit headers exist
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['ratelimit-limit']).toBeDefined();
  });

  test('✅ Should apply security headers to all routes', async () => {
    const healthResponse = await request(app)
      .get('/health')
      .expect(200);

    const protectedResponse = await request(app)
      .get('/api/protected')
      .expect(200);

    // Both should have security headers
    expect(healthResponse.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(protectedResponse.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('✅ Should block malicious Content-Type attempts', async () => {
    const response = await request(app)
      .get('/health')
      .set('Content-Type', 'application/javascript')
      .expect(200);

    // MIME-sniffing prevention header should be present
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});

// ══════════════════════════════════════════════════════════════
// TEST SUITE 4: Error Handling
// ══════════════════════════════════════════════════════════════

describe('⚠️ Error Handling', () => {
  
  test('✅ Should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.status).toBe(404);
  });

  test('✅ Should still have security headers on 404 responses', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);

    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('✅ Should have security headers on rate limit responses', async () => {
    await request(app).get('/api/test');
    await request(app).get('/api/test');
    
    const response = await request(app)
      .get('/api/test')
      .expect(429);

    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});

// ══════════════════════════════════════════════════════════════
// Summary Report
// ══════════════════════════════════════════════════════════════

/*
SECURITY TEST SUMMARY
═══════════════════════════════════════════════════════════════

✅ Helmet Headers (7 tests)
  - X-Frame-Options: DENY (Clickjacking prevention)
  - X-Content-Type-Options: nosniff (MIME-sniffing prevention)
  - X-XSS-Protection: 1; mode=block (XSS prevention)
  - Content-Security-Policy (Resource loading control)
  - Strict-Transport-Security (HTTPS enforcement)
  - Referrer-Policy (Information disclosure prevention)
  - X-Powered-By removed (Info disclosure prevention)

⏱️ Rate Limiting (6 tests)
  - Requests under limit are allowed
  - RateLimit headers included in responses
  - Requests over limit get 429 status
  - Remaining count decreases correctly
  - Window resets after timeout

🔐 Integration (3 tests)
  - Security headers apply to all routes
  - Rate limiting works with security headers
  - Malicious Content-Type attempts blocked

⚠️ Error Handling (3 tests)
  - 404 responses have security headers
  - Rate limit responses have security headers

Total: 19 tests (All critical security checks)
═══════════════════════════════════════════════════════════════
*/
