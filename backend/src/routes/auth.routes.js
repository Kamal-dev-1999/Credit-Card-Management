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
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyToken(token);
    res.json({
      userId: decoded.userId,
      email: decoded.email,
    });
  } catch (err) {
    console.warn('⚠️  [Auth] Invalid token:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * POST /api/auth/logout
 * Clear the auth cookie and logout user
 */
router.post('/logout', (req, res) => {
  try {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
