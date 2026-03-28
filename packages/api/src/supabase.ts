/**
 * Frontend Supabase Client
 *
 * Used in mobile and web apps
 * Uses anonymous key (public, safe for frontend)
 * Respects RLS policies
 *
 * Environment variables (from .env):
 * - EXPO_PUBLIC_SUPABASE_URL: Supabase project URL
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY: Public anonymous key
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Supabase client may not be initialized.');
}

/**
 * Frontend Supabase client
 * Uses anonymous key (public)
 * Respects RLS policies
 *
 * Used for:
 * - User authentication
 * - Real-time subscriptions
 * - Client-side queries (filtered by RLS)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Get authenticated user from session
 */
export async function getAuthUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current session
 */
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
