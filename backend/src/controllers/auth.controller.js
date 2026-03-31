const { google } = require('googleapis');
const { supabase } = require('../config/supabase');
const { encrypt } = require('../utils/encryption');
const { generateToken } = require('../utils/jwt');
require('dotenv').config();

// Configure the Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const initiateGoogleAuth = (req, res) => {
  try {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: 'default-user-id' 
    });

    // Redirect the browser directly to Google's consent screen
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Error initiating Google Auth:', error);
    res.status(500).json({ error: 'Failed to initiate authentication flow' });
  }
};

const handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the real Google user profile (name, email)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();
    const userEmail = profile.email;

    // Upsert user by email
    const { data: upsertedUser, error: upsertError } = await supabase
      .from('users')
      .upsert([{ email: userEmail }], { onConflict: 'email' })
      .select()
      .single();
      
    if (upsertError) throw upsertError;
    const user = upsertedUser;

    // ── Encrypt and store the refresh token ──
    if (tokens.refresh_token) {
      const encryptedRefreshToken = encrypt(tokens.refresh_token);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ google_refresh_token: encryptedRefreshToken })
        .eq('id', user.id);
        
      if (updateError) {
        console.warn('⚠️  Could not store refresh token:', updateError.message);
      } else {
        console.log('✅ Encrypted refresh token stored securely');
      }
    } else {
      console.log('⚠️ No refresh token — user may have authorized before.');
    }

    // ── Generate JWT and set httpOnly cookie ──
    const jwtToken = generateToken(user.id, userEmail);

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('auth_token', jwtToken, {
      httpOnly: true,        // Prevents XSS attacks
      secure: false,         // Allow HTTP in development
      sameSite: 'lax',       // Works with top-level navigation across ports
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    console.log(`✅ User authenticated: ${userEmail}`);
    console.log(`✅ Cookie set with token (httpOnly, sameSite=lax)`);
    
    // Redirect back to frontend - IMPORTANT: Use same origin as frontend (localhost, not 127.0.0.1)
    res.redirect('http://localhost:5173/?auth=success');
  } catch (error) {
    console.error('❌ Error handling Google Callback:', error);
    res.redirect('http://localhost:5173/?auth=error');
  }
};

module.exports = {
  initiateGoogleAuth,
  handleGoogleCallback
};
