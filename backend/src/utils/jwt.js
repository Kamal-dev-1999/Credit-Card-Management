const jwt = require('jsonwebtoken');

/**
 * JWT Token Utility
 * Handles creation and verification of JWT tokens for session management
 */

/**
 * Generate a JWT token
 * @param {string} userId - User ID from database
 * @param {string} email - User email
 * @returns {string} - Signed JWT token
 */
const generateToken = (userId, email) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, secret, {
    expiresIn: '7d', // Token expires in 7 days
    algorithm: 'HS256',
  });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded payload if valid
 * @throws {Error} - If token is invalid or expired
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch (err) {
    throw new Error(`Invalid or expired token: ${err.message}`);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
