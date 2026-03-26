const express = require('express');
const { initiateGoogleAuth, handleGoogleCallback } = require('../controllers/auth.controller.js');

const router = express.Router();

// GET /api/auth/google
router.get('/google', initiateGoogleAuth);

// GET /api/auth/google/callback
router.get('/google/callback', handleGoogleCallback);

module.exports = router;
