const crypto = require('crypto');

/**
 * Encryption Service - AES-256-GCM
 * Encrypts and decrypts sensitive data like Google Refresh Tokens
 */

const ALGORITHM = 'aes-256-gcm';
const KEYLEN = 32; // 256 bits
const IVLEN = 16;  // 128 bits
const AUTHTAG_LEN = 16; // 128 bits

// Derive encryption key from ENCRYPTION_KEY env variable
const getEncryptionKey = () => {
  const keyEnv = process.env.ENCRYPTION_KEY;
  
  if (!keyEnv) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Please add it to your .env file.');
  }

  // If the env var is already 64 hex characters (32 bytes), use it directly
  // Otherwise, derive it using PBKDF2
  if (keyEnv.length === 64 && /^[0-9a-f]+$/.test(keyEnv)) {
    return Buffer.from(keyEnv, 'hex');
  }

  // Derive key using PBKDF2 (Password-Based Key Derivation)
  return crypto.pbkdf2Sync(keyEnv, 'credit-card-manager', 100000, KEYLEN, 'sha256');
};

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @returns {string} - Base64 encoded encrypted data with IV and auth tag
 */
const encrypt = (plaintext) => {
  if (!plaintext) return plaintext; // Skip null/empty values

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IVLEN);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: IV + authTag + encryptedData (all in hex)
    const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;
    
    // Return as base64 for storage
    return Buffer.from(combined, 'hex').toString('base64');
  } catch (err) {
    console.error('❌ [Encryption] Encryption failed:', err.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param {string} encryptedBase64 - Base64 encoded encrypted data
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (encryptedBase64) => {
  if (!encryptedBase64) return encryptedBase64; // Skip null/empty values

  try {
    const key = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(encryptedBase64, 'base64').toString('hex');

    // Extract parts
    const iv = Buffer.from(combined.slice(0, IVLEN * 2), 'hex');
    const authTag = Buffer.from(combined.slice(IVLEN * 2, IVLEN * 2 + AUTHTAG_LEN * 2), 'hex');
    const encrypted = combined.slice(IVLEN * 2 + AUTHTAG_LEN * 2);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('❌ [Encryption] Decryption failed:', err.message);
    throw new Error('Failed to decrypt data - possible corruption or wrong key');
  }
};

module.exports = {
  encrypt,
  decrypt,
};
