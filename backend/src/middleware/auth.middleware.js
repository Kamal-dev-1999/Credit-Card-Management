const { verifyToken } = require('../utils/jwt');

/**
 * Authentication Middleware
 * Extracts user info from JWT token in httpOnly cookie
 * Sets req.user with { userId, email } if token is valid
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      // No token - continue as anonymous user
      req.user = { userId: null, email: 'anonymous-user' };
      return next();
    }

    // Verify and decode token
    const payload = verifyToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    // Log successful authentication ONLY for dashboard/cards/etc routes, not for every request
    if (!req.path.includes('/health') && !req.path.includes('/api/notifications')) {
      console.log(`✅ Authenticated: ${req.user.email}`);
    }
    
    next();
  } catch (err) {
    console.warn(`⚠️  Token verification failed: ${err.message}`);
    // Set as anonymous user if token is invalid
    req.user = { userId: null, email: 'anonymous-user' };
    next();
  }
};

module.exports = authMiddleware;
