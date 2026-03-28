/**
 * Signed URL Service
 *
 * Generates time-limited signed URLs for Supabase storage access
 * Uses Supabase's built-in signed URL generation
 *
 * CRITICAL: All signed URLs expire in 600 seconds (10 minutes) or less
 * This prevents unauthorized access through leaked URLs
 */

import { getSupabase } from '../lib/supabase';

/**
 * Generate a signed download URL for a file
 * URL expires in 600 seconds (10 minutes)
 *
 * @param bucket - Storage bucket name (e.g., 'case-files')
 * @param path - Full path to file in bucket
 * @returns Signed URL valid for 600 seconds
 *
 * SECURITY: Expiry is hardcoded to 600s max
 */
export async function generateDownloadUrl(
  bucket: string,
  path: string
): Promise<string> {
  try {
    if (!bucket || !path) {
      throw new Error('Bucket and path required');
    }

    // CRITICAL: Expiry time MUST be <= 600 seconds
    const expirySeconds = 600; // 10 minutes maximum

    // Generate signed URL using Supabase
    const { data, error } = await getSupabase().storage
      .from(bucket)
      .createSignedUrl(path, expirySeconds);

    if (error) {
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Download URL generation failed:', error);
    throw error;
  }
}

/**
 * Generate a signed upload URL for a file
 * URL expires in 600 seconds (10 minutes)
 *
 * @param bucket - Storage bucket name
 * @param path - Upload destination path
 * @returns Signed URL for uploading
 *
 * SECURITY: Short expiry prevents URL reuse
 */
export async function generateUploadUrl(
  bucket: string,
  path: string
): Promise<string> {
  try {
    if (!bucket || !path) {
      throw new Error('Bucket and path required');
    }

    // CRITICAL: Expiry time MUST be <= 600 seconds
    const expirySeconds = 600;

    // Generate signed URL using Supabase
    const { data, error } = await getSupabase().storage
      .from(bucket)
      .createSignedUrl(path, expirySeconds);

    if (error) {
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Upload URL generation failed:', error);
    throw error;
  }
}

/**
 * Generate a signed URL with custom expiry (max 600 seconds)
 *
 * @param bucket - Storage bucket name
 * @param path - File path in bucket
 * @param expirySeconds - Seconds until expiry (max 600)
 * @returns Signed URL
 *
 * SECURITY: Enforces 600-second maximum
 */
export async function generateSignedUrl(
  bucket: string,
  path: string,
  expirySeconds: number = 600
): Promise<string> {
  try {
    // CRITICAL: Enforce maximum expiry time
    if (expirySeconds > 600) {
      console.warn(
        `Signed URL expiry requested (${expirySeconds}s) exceeds maximum (600s). Using 600s.`
      );
      expirySeconds = 600;
    }

    if (expirySeconds <= 0) {
      throw new Error('Expiry time must be positive');
    }

    // Generate signed URL
    const { data, error } = await getSupabase().storage
      .from(bucket)
      .createSignedUrl(path, expirySeconds);

    if (error) {
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned');
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL generation failed:', error);
    throw error;
  }
}

/**
 * Parse a Supabase signed URL to extract metadata
 * Useful for logging and audit purposes
 *
 * @param signedUrl - Full signed URL
 * @returns Parsed metadata
 */
export interface SignedUrlMetadata {
  bucket: string;
  path: string;
  hasToken: boolean;
  expiryTime?: number; // Unix timestamp
}

export function parseSignedUrl(signedUrl: string): SignedUrlMetadata {
  try {
    const url = new URL(signedUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+)/);

    if (!pathMatch) {
      return {
        bucket: 'unknown',
        path: url.pathname,
        hasToken: url.searchParams.has('token'),
      };
    }

    return {
      bucket: pathMatch[1],
      path: decodeURIComponent(pathMatch[2]),
      hasToken: url.searchParams.has('token'),
      expiryTime: url.searchParams.get('expires') ? parseInt(url.searchParams.get('expires')!) : undefined,
    };
  } catch (error) {
    console.error('Signed URL parsing failed:', error);
    return {
      bucket: 'unknown',
      path: signedUrl,
      hasToken: false,
    };
  }
}

/**
 * Verify that a signed URL is still valid
 * Checks expiry time
 *
 * @param signedUrl - Signed URL to verify
 * @returns true if URL is still valid
 */
export function isSignedUrlValid(signedUrl: string): boolean {
  try {
    const metadata = parseSignedUrl(signedUrl);

    if (!metadata.expiryTime) {
      // Can't verify without expiry time, assume valid
      return true;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    return nowSeconds < metadata.expiryTime;
  } catch (error) {
    console.error('Signed URL validation failed:', error);
    return false;
  }
}

/**
 * Configuration constants
 *
 * CRITICAL: These enforce security limits
 */
export const SIGNED_URL_CONFIG = {
  // Maximum expiry time in seconds
  // DO NOT INCREASE without security review
  MAX_EXPIRY_SECONDS: 600,

  // Default expiry times for different operations
  DOWNLOAD_EXPIRY_SECONDS: 600,
  UPLOAD_EXPIRY_SECONDS: 600,
  EXPORT_EXPIRY_SECONDS: 600,
  PREVIEW_EXPIRY_SECONDS: 300, // 5 minutes for previews

  // Storage buckets
  BUCKETS: {
    CASE_FILES: 'case-files',
    EXPORTS: 'case-exports',
  },
};
