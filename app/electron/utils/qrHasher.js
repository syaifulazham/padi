const crypto = require('crypto');

/**
 * QR Code Hashing Utility
 * 
 * This module provides secure hashing for QR codes from subsidy cards.
 * The actual QR code is never stored - only the hash is persisted.
 * This protects sensitive government-issued codes while still allowing verification.
 * 
 * Security Features:
 * - HMAC-SHA256 with secret key
 * - One-way hashing (cannot reverse)
 * - Constant-time comparison for verification
 */

class QRHasher {
  constructor() {
    // Use environment variable or default (set in main.js)
    this.secret = process.env.QR_HASH_SECRET || 'f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1';
    
    if (!this.secret || this.secret.length < 32) {
      console.error('QR_HASH_SECRET not properly configured, using default');
      this.secret = 'f6062c05ab1559acdd77be781745b1845d8cc23bddf583c99ce6f5e40e6790b1';
    }
  }

  /**
   * Hash a QR code using HMAC-SHA256
   * @param {string} qrCode - The raw QR code to hash
   * @returns {string} - The hashed value (hex string)
   */
  hash(qrCode) {
    if (!qrCode) {
      throw new Error('QR code cannot be empty');
    }

    // Create HMAC using SHA-256
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(qrCode);
    return hmac.digest('hex');
  }

  /**
   * Verify if a QR code matches a stored hash
   * Uses constant-time comparison to prevent timing attacks
   * @param {string} qrCode - The raw QR code to verify
   * @param {string} storedHash - The hash to compare against
   * @returns {boolean} - True if match, false otherwise
   */
  verify(qrCode, storedHash) {
    if (!qrCode || !storedHash) {
      return false;
    }

    try {
      const computedHash = this.hash(qrCode);
      
      // Use crypto.timingSafeEqual for constant-time comparison
      // This prevents timing attacks
      const computedBuffer = Buffer.from(computedHash, 'hex');
      const storedBuffer = Buffer.from(storedHash, 'hex');
      
      if (computedBuffer.length !== storedBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(computedBuffer, storedBuffer);
    } catch (error) {
      console.error('Error verifying QR code hash:', error);
      return false;
    }
  }

  /**
   * Get hash info for logging/debugging (without revealing the secret)
   * @returns {object} - Information about the hashing configuration
   */
  getInfo() {
    return {
      algorithm: 'HMAC-SHA256',
      secretLength: this.secret.length,
      outputLength: 64, // hex string length for SHA-256
    };
  }
}

// Export singleton instance
module.exports = new QRHasher();
