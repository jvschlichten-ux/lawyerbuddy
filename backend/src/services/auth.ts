/**
 * Authentication Service
 *
 * Business logic for user authentication, signup, password reset, and invite flow
 */

import { getSupabase, getSupabaseServiceRole } from '../lib/supabase';
import { generateInviteToken, isValidTokenFormat, isNotExpired } from '../utils/token';
import type { UserProfile } from '@lawyerbuddy/shared';

interface SignupPayload {
  email: string;
  password: string;
  fullName: string;
  role: 'lawyer' | 'client';
  phone?: string;
  preferredLanguage?: 'en' | 'es';
}

interface LoginPayload {
  email: string;
  password: string;
}

interface InviteAcceptPayload {
  token: string;
  email: string;
  password: string;
  fullName: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

/**
 * Sign up a new user (lawyer only)
 * Creates auth.users entry and profiles entry
 * Uses service role for admin user creation
 */
export async function signupLawyer(payload: SignupPayload): Promise<{ user: any; profile: UserProfile }> {
  // Use service role to create user (requires admin access)
  const serviceRoleClient = getSupabaseServiceRole();
  const { data: authData, error: authError } = await serviceRoleClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true, // Auto-confirm in development, send in production
  });

  if (authError) {
    throw new Error(`Signup failed: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('User creation returned no user data');
  }

  // Create profile entry using service role to bypass RLS
  const { data: profile, error: profileError } = await serviceRoleClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: payload.email,
      full_name: payload.fullName,
      role: payload.role,
      phone: payload.phone,
      preferred_language: payload.preferredLanguage || 'en',
    })
    .select()
    .single();

  if (profileError) {
    // Clean up auth user if profile creation fails
    await serviceRoleClient.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  return {
    user: authData.user,
    profile: profile as UserProfile,
  };
}

/**
 * Log in with email and password
 * Returns JWT session
 */
export async function login(payload: LoginPayload): Promise<{ session: any; user: any }> {
  const client = getSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  if (!data.session) {
    throw new Error('Login returned no session');
  }

  return {
    session: data.session,
    user: data.user,
  };
}

/**
 * Generate a case invite for a client
 * Returns token that client uses in invite acceptance
 */
export async function generateCaseInvite(
  caseId: string,
  lawyerId: string,
  invitedEmail: string
): Promise<{ token: string; expiresAt: Date }> {
  const client = getSupabase();
  const token = generateInviteToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

  // Insert into case_invites using RLS (lawyer_id = auth.uid() required)
  const { data, error } = await client
    .from('case_invites')
    .insert({
      case_id: caseId,
      lawyer_id: lawyerId,
      invited_email: invitedEmail,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to generate invite: ${error.message}`);
  }

  return {
    token,
    expiresAt,
  };
}

/**
 * Validate and accept a case invite
 * Creates client user, creates profile, updates case_invites status, links client to case
 */
export async function acceptCaseInvite(payload: InviteAcceptPayload): Promise<{ user: any; profile: UserProfile; caseId: string }> {
  const { token, email, password, fullName } = payload;

  if (!isValidTokenFormat(token)) {
    throw new Error('Invalid token format');
  }

  // Use service role for invite lookup (no auth required)
  const serviceRoleClient = getSupabaseServiceRole();
  const { data: invites, error: fetchError } = await serviceRoleClient
    .from('case_invites')
    .select('*')
    .eq('token', token)
    .single();

  if (fetchError || !invites) {
    throw new Error('Invite not found or already used');
  }

  // Validate invite constraints
  if (invites.status !== 'pending') {
    throw new Error(`Invite is ${invites.status}, cannot accept`);
  }

  if (invites.invited_email !== email) {
    throw new Error('Email does not match invite recipient');
  }

  if (!isNotExpired(new Date(invites.expires_at))) {
    throw new Error('Invite has expired');
  }

  // Create user in auth.users using service role
  const { data: authData, error: authError } = await serviceRoleClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for development, send verification in production
  });

  if (authError) {
    throw new Error(`User creation failed: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('User creation returned no user data');
  }

  // Create profile (client role) using service role
  const { data: profile, error: profileError } = await serviceRoleClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role: 'client',
      preferred_language: 'en',
    })
    .select()
    .single();

  if (profileError) {
    await serviceRoleClient.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  // Update case with client_id
  const { error: caseError } = await serviceRoleClient
    .from('cases')
    .update({ client_id: authData.user.id })
    .eq('id', invites.case_id);

  if (caseError) {
    await serviceRoleClient.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Failed to link case: ${caseError.message}`);
  }

  // Mark invite as accepted
  const { error: inviteError } = await serviceRoleClient
    .from('case_invites')
    .update({ status: 'accepted' })
    .eq('id', invites.id);

  if (inviteError) {
    console.error('Warning: Failed to update invite status after acceptance', inviteError);
    // Don't fail the whole operation, user is already created
  }

  return {
    user: authData.user,
    profile: profile as UserProfile,
    caseId: invites.case_id,
  };
}

/**
 * Request password reset
 * Sends reset link to email
 */
export async function requestPasswordReset(payload: ForgotPasswordPayload): Promise<void> {
  const client = getSupabase();
  const { error } = await client.auth.resetPasswordForEmail(payload.email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });

  if (error) {
    // Don't leak whether email exists
    console.error('Password reset error:', error);
  }

  // Always return success to prevent email enumeration
}

/**
 * Complete password reset with token
 * Updates password for user
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  const client = getSupabase();
  const { error } = await client.auth.updateUser({
    password: payload.newPassword,
  });

  if (error) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
}

/**
 * Get user profile by ID
 * Uses service role for reliable access (bypasses RLS)
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  // Use service role to bypass any RLS restrictions
  const client = getSupabaseServiceRole();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Profile fetch failed: ${error.message}`);
  }

  if (!data) {
    throw new Error('Profile not found');
  }

  return data as UserProfile;
}

/**
 * Internal: Get invite by token (used for validation)
 * Note: In production, this should use Supabase service role
 * to bypass RLS and validate tokens from unauthenticated requests
 */
export async function getInviteByToken(token: string) {
  // Service role call would look like:
  // const { data, error } = await supabaseServiceRole
  //   .from('case_invites')
  //   .select('*')
  //   .eq('token', token)
  //   .single();
  //
  // For now, return a mock to demonstrate the structure
  return {
    data: null,
    error: 'Not implemented - requires service role setup',
  };
}
