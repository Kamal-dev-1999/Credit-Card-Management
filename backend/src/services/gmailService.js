const { google } = require('googleapis');
require('dotenv').config();

/**
 * Creates an authenticated Gmail client using the stored refresh token.
 */
const createGmailClient = (refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Decodes a base64url encoded Gmail message part.
 */
const decodeBase64 = (data) => {
  const buff = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return buff.toString('utf-8');
};

/**
 * Recursively extracts plain text or HTML from email parts.
 */
const extractBody = (payload) => {
  if (!payload) return '';

  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload.parts) {
    // Prefer text/plain, fall back to text/html
    const plainPart = payload.parts.find(p => p.mimeType === 'text/plain');
    if (plainPart?.body?.data) return decodeBase64(plainPart.body.data);

    const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
    if (htmlPart?.body?.data) return decodeBase64(htmlPart.body.data);

    // Recurse into multipart
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return '';
};

/**
 * Searches the user's Gmail for credit card statement/bill emails
 * from the last 30 days and returns an array of { subject, body, messageId }.
 */
const fetchCreditCardEmails = async (refreshToken) => {
  const gmail = createGmailClient(refreshToken);

  // Build a date filter for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const afterTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);

  // Targeted query: only emails FROM known bank domains with billing subjects
  const query = [
    'from:(hdfcbank.net OR hdfcbank.com OR',
    'icicibank.com OR sbicard.com OR',
    'rblbank.com OR axisbank.com OR',
    'kotak.com OR kotakbank.com OR americanexpress.com OR',
    'indusind.com OR idfcfirstbank.com OR yesbank.in)',
    `subject:(statement OR "e-statement" OR "e-Statement" OR due OR bill)`,
    `after:${afterTimestamp}`
  ].join(' ');

  console.log(`🔍 Searching Gmail with query: ${query}`);

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 20,
  });

  const messages = listResponse.data.messages || [];
  console.log(`📧 Found ${messages.length} matching emails.`);

  const emails = [];

  for (const msg of messages) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || '';
      
      // Get body - prioritize HTML for statements as they contain tables
      const body = extractBody(detail.data.payload);

      // Only process if body has meaningful content
      if (body.length > 50) {
        console.log(`  ✉️  [${emails.length + 1}] Subject: "${subject}" | From: ${from}`);
        // Increase limit to 10,000 to capture bottom-of-email totals
        emails.push({ messageId: msg.id, subject, from, body: body.slice(0, 10000) });
      } else {
        console.log(`  ⏭️  Skipped (body too short): "${subject}"`);
      }
    } catch (err) {
      console.error(`❌ Could not fetch message ${msg.id}:`, err.message);
    }
  }

  return emails;
};

module.exports = { fetchCreditCardEmails };
