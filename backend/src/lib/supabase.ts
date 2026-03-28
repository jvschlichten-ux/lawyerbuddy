/**
 * Supabase Clients
 *
 * Two clients:
 * 1. supabase — Regular authenticated client (uses SUPABASE_ANON_KEY)
 *    Used for client-facing operations, respects RLS policies
 *
 * 2. supabaseServiceRole — Service role client (uses SUPABASE_SERVICE_ROLE_KEY)
 *    Bypasses RLS policies, used only for server-side operations
 *    DO NOT expose service role key to frontend
 *
 * Clients are lazy-loaded to allow .env to be loaded before initialization
 */

import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
let _supabaseServiceRole: any = null;

function initializeClients() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  }

  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  if (!_supabaseServiceRole) {
    _supabaseServiceRole = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
}

/**
 * Regular Supabase client
 * Uses anonymous key (public)
 * Respects RLS policies
 * Safe to use in authenticated endpoints
 */
export function getSupabase() {
  if (!_supabase) {
    initializeClients();
  }
  return _supabase;
}

/**
 * Service role Supabase client
 * Uses service role key (secret)
 * BYPASSES RLS policies
 * Only for server-side operations where we need full database access
 *
 * Examples of service-role-only operations:
 * - Validating invite tokens without authentication
 * - Sending system notifications
 * - Batch operations during setup
 * - Admin operations (createUser, deleteUser)
 *
 * ⚠️ CRITICAL: Never expose this to frontend or client code
 */
export function getSupabaseServiceRole() {
  if (!_supabaseServiceRole) {
    initializeClients();
  }
  return _supabaseServiceRole;
}
