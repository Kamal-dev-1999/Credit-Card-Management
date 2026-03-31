const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter - 100 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

/**
 * Strict rate limiter for authentication - 5 attempts per 15 minutes per IP
 * Prevents brute force attacks on login/signup
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests (non-2xx responses)
});

/**
 * Email sync limiter - 10 syncs per hour per user
 * Prevents abuse of Gmail sync feature
 */
const syncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many sync requests. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Rate limit by user email instead of IP for authenticated requests
    return req.user?.email || req.ip;
  }
});

/**
 * Card discovery limiter - 3 attempts per hour per user
 * Prevents spam of card discovery feature
 */
const discoverLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many card discovery attempts. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?.email || req.ip;
  }
});

/**
 * API endpoint limiter - 50 requests per minute per IP
 * For general API operations
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  syncLimiter,
  discoverLimiter,
  apiLimiter
};
