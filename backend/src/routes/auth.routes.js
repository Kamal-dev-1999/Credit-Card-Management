const express = require('express');
const { initiateGoogleAuth, handleGoogleCallback } = require('../controllers/auth.controller.js');
const { verifyToken } = require('../utils/jwt');
const { supabase } = require('../config/supabase');

const router = express.Router();

// GET /api/auth/google
router.get('/google', initiateGoogleAuth);

// GET /api/auth/google/callback
router.get('/google/callback', handleGoogleCallback);

/**
 * GET /api/auth/me
 * Get current authenticated user info from JWT cookie
 */
router.get('/me', (req, res) => {
  try {
    console.log('🔐 [Auth /me] Request received');
    console.log('🔐 [Auth /me] Cookies:', Object.keys(req.cookies));
    console.log('🔐 [Auth /me] auth_token present:', !!req.cookies.auth_token);
    
    const token = req.cookies.auth_token;

    if (!token) {
      console.log('🔐 [Auth /me] No auth_token cookie found - returning 401');
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    console.log('🔐 [Auth /me] Token verified successfully for:', decoded.email);
    res.json({
      userId: decoded.userId,
      email: decoded.email,
    });
  } catch (err) {
    console.warn('⚠️  [Auth /me] Invalid token:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * POST /api/auth/logout
 * Clear the auth cookie and logout user
 */
router.post('/logout', (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'none',
      path: '/',
    });

    console.log('✅ User logged out');
    res.json({ success: true });
  } catch (err) {
    console.error('❌ [Auth] Logout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
