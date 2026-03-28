/**
 * Token Generation and Validation Utilities
 *
 * Handles secure token generation for case invites
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 * Returns 32-byte random hex string (64 characters)
 * Used for case invite links
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate that a token is a valid hex string of expected length
 */
export function isValidTokenFormat(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Check if a timestamp is in the future (not expired)
 */
export function isNotExpired(expiresAt: Date): boolean {
  return expiresAt > new Date();
}
