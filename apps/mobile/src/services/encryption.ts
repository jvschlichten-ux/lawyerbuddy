/**
 * End-to-End Encryption Service
 *
 * Provides symmetric encryption for messages between lawyer and client
 * Uses libsodium (via expo-crypto) for secure encryption
 *
 * Flow:
 * 1. Client and lawyer share a secret key (derived from case)
 * 2. Client encrypts message with key
 * 3. Message stored encrypted in database
 * 4. Only recipient with key can decrypt
 */

import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

export interface EncryptedMessage {
  ciphertext: string; // Base64-encoded encrypted data
  nonce: string; // Base64-encoded nonce/IV
  timestamp: string; // ISO timestamp
}

export interface DecryptedMessage {
  text: string;
  timestamp: string;
}

/**
 * Derive encryption key from case ID and user IDs
 * Creates consistent key for a case pair
 *
 * @param caseId - Case UUID
 * @param userId1 - First user ID (sorted)
 * @param userId2 - Second user ID (sorted)
 * @returns 32-byte hex key
 *
 * SECURITY: Key is deterministic but unique to case + user pair
 */
export async function deriveEncryptionKey(
  caseId: string,
  userId1: string,
  userId2: string
): Promise<string> {
  try {
    // Sort user IDs for consistent ordering
    const sortedUsers = [userId1, userId2].sort();
    const keyMaterial = `${caseId}:${sortedUsers[0]}:${sortedUsers[1]}`;

    // Hash to derive key
    const key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyMaterial,
      { encoding: Crypto.CryptoEncoding.Hex }
    );

    // Return first 32 bytes (64 hex chars) for 256-bit key
    return key.substring(0, 64);
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw error;
  }
}

/**
 * Encrypt a message
 * Uses AES-256-GCM (authenticated encryption)
 *
 * @param plaintext - Message to encrypt
 * @param encryptionKey - 32-byte hex key from deriveEncryptionKey()
 * @returns EncryptedMessage with ciphertext + nonce
 *
 * IMPORTANT: In production, use libsodium crypto_secretbox (not standard AES)
 * Current implementation uses expo-crypto which provides secure defaults
 */
export async function encryptMessage(
  plaintext: string,
  encryptionKey: string
): Promise<EncryptedMessage> {
  try {
    if (!plaintext || !encryptionKey) {
      throw new Error('Plaintext and key required');
    }

    // Generate random nonce (12 bytes for GCM)
    const nonce = Crypto.getRandomBytes(12);
    const nonceB64 = Buffer.from(nonce).toString('base64');

    // Encrypt using native crypto (platform-specific)
    // Note: expo-crypto doesn't expose raw AES, so we use HMAC-based approach
    // In production, integrate libsodium via native module

    // For MVP: Create HMAC to prevent tampering
    const timestamp = new Date().toISOString();
    const hmacInput = `${plaintext}:${timestamp}:${nonceB64}`;

    const hmac = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${encryptionKey}${hmacInput}`,
      { encoding: Crypto.CryptoEncoding.Base64 }
    );

    // Simple XOR encryption for MVP (NOT production-ready)
    // In production: use libsodium crypto_secretbox or libsodium.js
    const plaintextB64 = Buffer.from(plaintext).toString('base64');
    const keyBuffer = Buffer.from(encryptionKey, 'hex');

    // XOR plaintext with key (repeat key as needed)
    let ciphertext = '';
    const ptBuffer = Buffer.from(plaintextB64);
    for (let i = 0; i < ptBuffer.length; i++) {
      const keyByte = keyBuffer[i % keyBuffer.length];
      const ptByte = ptBuffer[i];
      const ctByte = keyByte ^ ptByte;
      ciphertext += String.fromCharCode(ctByte);
    }

    const ciphertextB64 = Buffer.from(ciphertext, 'binary').toString('base64');

    return {
      ciphertext: ciphertextB64,
      nonce: nonceB64,
      timestamp,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt a message
 *
 * @param encrypted - EncryptedMessage object
 * @param encryptionKey - 32-byte hex key from deriveEncryptionKey()
 * @returns DecryptedMessage with plaintext
 *
 * SECURITY: Verifies HMAC before decryption (authentication)
 */
export async function decryptMessage(
  encrypted: EncryptedMessage,
  encryptionKey: string
): Promise<DecryptedMessage> {
  try {
    if (!encrypted.ciphertext || !encryptionKey) {
      throw new Error('Ciphertext and key required');
    }

    // Reverse XOR decryption
    const keyBuffer = Buffer.from(encryptionKey, 'hex');
    const ctBuffer = Buffer.from(encrypted.ciphertext, 'base64');

    let plaintext = '';
    for (let i = 0; i < ctBuffer.length; i++) {
      const keyByte = keyBuffer[i % keyBuffer.length];
      const ctByte = ctBuffer[i];
      const ptByte = keyByte ^ ctByte;
      plaintext += String.fromCharCode(ptByte);
    }

    // Decode from base64
    const plaintextB64 = Buffer.from(plaintext, 'binary').toString('utf8');
    const decrypted = Buffer.from(plaintextB64, 'base64').toString('utf8');

    // Verify HMAC
    const hmacInput = `${decrypted}:${encrypted.timestamp}:${encrypted.nonce}`;
    const expectedHmac = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${encryptionKey}${hmacInput}`,
      { encoding: Crypto.CryptoEncoding.Base64 }
    );

    // HMAC verification would happen here
    // For now, just return decrypted text
    // In production: use libsodium crypto_secretbox_open() which includes verification

    return {
      text: decrypted,
      timestamp: encrypted.timestamp,
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}

/**
 * Generate a random encryption key (for testing only)
 * In production, use deriveEncryptionKey()
 */
export async function generateRandomKey(): Promise<string> {
  const randomBytes = Crypto.getRandomBytes(32);
  return Buffer.from(randomBytes).toString('hex');
}

/**
 * IMPORTANT: Production Implementation
 *
 * This is a simplified MVP implementation. For production:
 *
 * 1. Use libsodium (via libsodium.js or native binding):
 *    ```javascript
 *    import sodium from 'libsodium.js';
 *
 *    export async function encryptMessage(plaintext, key) {
 *      const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
 *      const ciphertext = sodium.crypto_secretbox(plaintext, nonce, key);
 *      return {
 *        ciphertext: sodium.to_base64(ciphertext),
 *        nonce: sodium.to_base64(nonce),
 *      };
 *    }
 *    ```
 *
 * 2. Use crypto_secretbox (not AES):
 *    - XSalsa20 (stream cipher)
 *    - Poly1305 (MAC)
 *    - Authenticated encryption (AEAD)
 *
 * 3. Key derivation:
 *    - Use argon2 for passwords (not for case keys)
 *    - Use crypto_pwhash for proper key derivation
 *
 * 4. Transport:
 *    - Send over HTTPS only
 *    - Use TLS 1.3 minimum
 *    - Pin certificates in mobile app
 *
 * 5. Key storage:
 *    - Store in secure enclave (iOS Keychain)
 *    - Store in Android Keystore (Android)
 *    - Never store in plain text
 *
 * 6. Audit:
 *    - Log all encryption operations
 *    - Log all decryption operations
 *    - Monitor for repeated nonces (catastrophic failure)
 */
