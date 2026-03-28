/**
 * ═══════════════════════════════════════════════════════════════
 *  parserRules.js  –  100% Rule-Based Credit Card Email Parser
 *  Zero AI, Zero API calls. Pure Regex + keyword matching.
 * ═══════════════════════════════════════════════════════════════
 *
 *  To add a new bank: add an entry to BANK_CONFIGS below.
 */

'use strict';

// ─── Bank Configuration Map ───────────────────────────────────────────────────
// Each entry maps sender-email patterns → bank metadata + optional custom regexes.
// If customPatterns is omitted, the UNIVERSAL_PATTERNS are used instead.

const BANK_CONFIGS = {
  // ── HDFC Bank ───────────────────────────────────────────────────────────────
  hdfc: {
    bankName: 'HDFC',
    senderPatterns: [/hdfcbank\.net/i, /hdfcbank\.com/i],
    subjectPatterns: [/statement.*credit\s*card/i, /credit\s*card.*statement/i],
    isPaymentSender: false,
  },

  // ── ICICI Bank ──────────────────────────────────────────────────────────────
  icici: {
    bankName: 'ICICI',
    senderPatterns: [/icicibank\.com/i],
    subjectPatterns: [/statement.*credit\s*card/i, /credit\s*card.*statement/i, /payment\s*received/i],
    isPaymentSender: false,
  },

  // ── SBI Card ─────────────────────────────────────────────────────────────────
  sbi: {
    bankName: 'SBI',
    senderPatterns: [/sbicard\.com/i, /sbi\.co\.in/i],
    subjectPatterns: [/sbi\s*card\s*statement/i, /statement/i],
    isPaymentSender: false,
  },

  // ── Axis Bank ────────────────────────────────────────────────────────────────
  axis: {
    bankName: 'Axis',
    senderPatterns: [/axisbank\.com/i],
    subjectPatterns: [/axis\s*bank\s*credit\s*card\s*statement/i, /statement/i],
    isPaymentSender: false,
  },

  // ── Kotak Bank ───────────────────────────────────────────────────────────────
  kotak: {
    bankName: 'Kotak',
    senderPatterns: [/kotak\.com/i, /kotakbank\.com/i],
    subjectPatterns: [/statement/i, /credit\s*card/i],
    isPaymentSender: false,
  },

  // ── RBL Bank ─────────────────────────────────────────────────────────────────
  rbl: {
    bankName: 'RBL',
    senderPatterns: [/rblbank\.com/i],
    subjectPatterns: [/statement/i, /credit\s*card/i, /payment/i],
    isPaymentSender: false,
  },

  // ── American Express ─────────────────────────────────────────────────────────
  amex: {
    bankName: 'AmEx',
    senderPatterns: [/americanexpress\.com/i],
    subjectPatterns: [/statement/i, /e-statement/i, /account\s*summary/i],
    isPaymentSender: false,
  },

  // ── IndusInd Bank ─────────────────────────────────────────────────────────────
  indusind: {
    bankName: 'IndusInd',
    senderPatterns: [/indusind\.com/i],
    subjectPatterns: [/statement/i, /credit\s*card/i],
    isPaymentSender: false,
  },

  // ── Yes Bank ────────────────────────────────────────────────────────────────
  yes: {
    bankName: 'Yes Bank',
    senderPatterns: [/yesbank\.in/i],
    subjectPatterns: [/statement/i, /credit\s*card/i],
    isPaymentSender: false,
  },

  // ── IDFC First Bank ──────────────────────────────────────────────────────────
  idfc: {
    bankName: 'IDFC First',
    senderPatterns: [/idfcfirstbank\.com/i],
    subjectPatterns: [/statement/i, /credit\s*card/i],
    isPaymentSender: false,
  },
};

// ─── Universal Regex Patterns ─────────────────────────────────────────────────
// Applied to ALL matched emails regardless of bank.

const UNIVERSAL_PATTERNS = {
  amountDue: [
    // IndusInd specific: "Total and Minimum Amounts Due... are ₹ 115509.00 DR and ₹9997.00 respectively"
    /Total\s+and\s+Minimum\s+Amounts\s+Due[^]*?are\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)\s+DR/i,
    // HDFC specific: "Spends of Rs.37853.21 as on" or similar patterns
    /(?:Spends\s+of|Amount\s+of|Total\s+Due\s+of|Statement\s+Balance|Your\s+dues)\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    // For HDFC Biz Grow: Look for "card statement" context and extract nearby amounts
    /(?:card\s+statement|credit\s+card)[^]*?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Standard labels with flexible spacing/tags
    /(?:Total\s+Amt\s+Due|Total\s+Amount\s+Due|Amount\s+Due|Statement\s+Balance|Outstanding\s+Amount|Total\s+Payable|Amt\s+Payable|Current\s+Due|Total\s+Due|Payable\s+Amt|Net\s+Amount\s+Payable|Amount\s+Payable|Payable\s+Amount|Current\s+Outstanding|Summary\s+of\s+Account)[^]{0,200}?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    // "Payment of INR 14,450.20 is due"
    /[Pp]ayment\s+of\s+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+is\s+due/i,
    // "Pay Rs. 14,450.20 by"
    /[Pp]ay\s+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+by/i,
    // "Minimum Amount Due INR 1,450.00"
    /[Mm]inimum\s+(?:Amount\s+)?[Dd]ue[^]{0,200}?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Specific for simple table layouts
    /(?:Total\s+Amount|Balance\s+Amount|Amount\s+Payable|Balance\s+Due)[^]{0,100}?(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  ],

  dueDate: [
    /(?:Due\s+Date|DueDate|Payment\s+Due\s+Date|Pay\s+By|Due\s+On|Date\s+of\s+Payment|By\s+Date|Due\s+by|due\s+by)[^]{0,200}?(\d{1,2}[\-\/\s](?:\d{1,2}|[A-Za-z]{3,9})[\-\/\s]\d{2,4})/i,
    /due\s+on\s+([^]{0,40}?(\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4}))/i, // Relaxed for SBI
    /by\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9},?\s+\d{4})/i,
    /due\s+by\s+(\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4})/i,
    /(?:Due|Pay\s+by)[^]{0,200}?(\d{1,2}(?:st|nd|rd|th)?[\-\/\s](?:\d{1,2}|[A-Za-z]{3,9})[\-\/\s]\d{2,4})/i,
  ],

  statementDate: [
    /(?:Statement\s+Date|Generated\s+On|Billing\s+Date|Statement\s+Period\s+Ending|as\s+on)[^]{0,200}?(\d{1,2}(?:st|nd|rd|th)?[\-\/\s](?:\d{1,2}|[A-Za-z]{3,9})[\-\/\s]\d{2,4})/i,
  ],

  last4Digits: [
    // Explicitly ignore common years (2024-2027) to avoid matching Axis bank year in subject
    /(?:card|account|ending\s*in|ending\s*with|number)\s*(?:No\.?\s*)?(?:[Xx\*]{2,}|\.{2,}|XXXX\-XXXX\-XXXX\-)\s*(?!2024|2025|2026|2027)(\d{4})/i,
    /(?:card|account|ending\s*in|ending\s*with|number)[^]{0,100}?(?!2024|2025|2026|2027)(\d{4})\b/i,
    /[Cc]ard\s*[Nn]o\.?\s*[xX\d]{0,12}(?!2024|2025|2026|2027)(\d{2,4})\b/i,
    /[xX]{2,}(?!2024|2025|2026|2027)(\d{2,4})\b/i, 
    /[xX]{4}\s*(?!2024|2025|2026|2027)(\d{4})/i,
    /XX(?!2024|2025|2026|2027)(\d{4})/i,
    /\*(?!2024|2025|2026|2027)(\d{4})\b/i,
    /(?:ending\s+in|ending\s+with)\s+(?!2024|2025|2026|2027)(\d{4})/i,
  ],

  paymentConfirmation: [
    /[Pp]ayment\s+(?:received|successful|confirmed|processed|thank\s+you|credited)/i,
    /[Tt]hank\s+you\s+for\s+(?:your\s+)?payment/i,
    /[Tt]ransaction\s+(?:confirmed|successful|complete)/i,
    /[Ss]uccessfully\s+paid/i,
    /Payment\s+for\s+your\s+SBI\s+Card\s+ending\s+in[^]{0,50}is\s+received/i,
    /[Rr]eceived\s+payment\s+of/i,
  ],
};

/**
 * Standardizes amount strings like "1,23,456.78" or "1234" -> 123456.78
 */
const cleanAmount = (str) => {
  if (!str) return null;
  // Remove currency symbols and commas, but PRESERVE the decimal dot
  const cleaned = str.replace(/[RsINR₹,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Standardizes various date formats to YYYY-MM-DD.
 */
const standardizeDate = (raw) => {
  if (!raw) return null;
  const str = raw.trim().replace(/\s+/g, ' ');

  const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4, june: 6, july: 7,
    august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  let d, mo, y;

  // DD/MM/YYYY or DD-MM-YYYY
  let m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    [, d, mo, y] = m;
    if (y.length === 2) y = '20' + y;
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }

  // DD-Mon-YYYY or DD Mon YYYY  e.g. 15-Mar-2026 or 15 March 2026
  m = str.match(/^(\d{1,2})[\-\s]([A-Za-z]{3,9})[\-\s](\d{2,4})$/);
  if (m) {
    mo = MONTHS[m[2].toLowerCase().substring(0, 3)];
    y = m[3];
    if (y.length === 2) y = '20' + y;
    if (mo) return `${y}-${String(mo).padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }

  // Mon DD, YYYY or Month DD YYYY e.g. March 15, 2026
  m = str.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (m) {
    mo = MONTHS[m[1].toLowerCase().substring(0, 3)];
    y = m[3];
    if (y.length === 2) y = '20' + y;
    if (mo) return `${y}-${String(mo).padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  }

  // YYYY-MM-DD passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  return null;
};

/**
 * Strips HTML tags and collapses whitespace.
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim();
};

/**
 * Tries each regex in an array against a text. Returns the first capture group match.
 */
const matchFirst = (patterns, text) => {
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m && m[1]) return m[1].trim();
  }
  return null;
};

// ─── Bank Identification ──────────────────────────────────────────────────────

/**
 * Identifies the bank config for an email based on sender domain.
 */
const identifyBank = (email) => {
  const from = (email.from || '').toLowerCase();
  for (const [key, config] of Object.entries(BANK_CONFIGS)) {
    if (config.senderPatterns.some(p => p.test(from))) {
      return config;
    }
  }
  return null;
};

// ─── Core Processing Function ─────────────────────────────────────────────────

/**
 * processEmail(email) — The main entry point.
 */
const processEmail = (email) => {
  const bank = identifyBank(email);

  if (!bank) {
    return null;
  }

  const rawBody = email.body || '';
  const body = stripHtml(rawBody);
  const subject = (email.subject || '').toLowerCase();

  // ── Check for payment confirmation first ──
  const isPaymentConfirmation = UNIVERSAL_PATTERNS.paymentConfirmation.some(p => p.test(body));

  // ── Extract fields ──
  const rawAmount   = matchFirst(UNIVERSAL_PATTERNS.amountDue, body);
  const rawDueDate  = matchFirst(UNIVERSAL_PATTERNS.dueDate, body);
  const rawStmtDate = matchFirst(UNIVERSAL_PATTERNS.statementDate, body);
  const rawLast4    = matchFirst(UNIVERSAL_PATTERNS.last4Digits, body);

  const amountDue      = cleanAmount(rawAmount);
  const dueDate        = standardizeDate(rawDueDate);
  const statementDate  = standardizeDate(rawStmtDate);
  const last4Digits    = rawLast4 || null;

  // ── Special handling for PDF-attached statements ──
  // If this is clearly a statement email (from subject) but body contains "attached" or "PDF",
  // it's likely a statement sent as attachment. Return minimal data rather than skip.
  const isStatementSubject = bank.subjectPatterns.some(p => p.test(subject));
  const isAttachmentEmail = /attached|PDF|pdf|e-statement|e-Statement/i.test(body);
  
  if (!amountDue && !isPaymentConfirmation) {
    // If it's a recognized statement but data is in attachment, try to estimate from subject
    if (isStatementSubject && isAttachmentEmail) {
      return {
        bankName: bank.bankName,
        last4Digits: null,
        amountDue: null,        // Can't extract from PDF
        dueDate: null,          // Can't extract from PDF
        statementDate: null,    // Can't extract from PDF
        isPaymentConfirmation: false,
        isAttachmentBased: true // Flag for UI to handle specially
      };
    }
    
    return null;
  }

  const result = {
    bankName: bank.bankName,
    last4Digits,
    amountDue,
    dueDate,
    statementDate,
    isPaymentConfirmation,
  };

  return result;
};

module.exports = { processEmail, identifyBank, BANK_CONFIGS };
