/**
 * aiParser.js — Thin compatibility shim.
 * All parsing is now handled by parserRules.js (100% rule-based, zero AI).
 * This file is kept so existing imports don't break.
 */

const { processEmail } = require('../utils/parserRules');

/**
 * Parses a credit card billing email using rule-based extraction only.
 * No LLM, no API calls, no rate limits.
 *
 * @param {Object} email - { subject, from, body }
 * @returns {Object|null}
 */
const parseEmailWithAI = async (email) => {
  return processEmail(email);
};

module.exports = { parseEmailWithAI };
