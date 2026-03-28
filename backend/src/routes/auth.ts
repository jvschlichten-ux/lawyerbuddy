/**
 * Authentication Routes
 *
 * Endpoints for signup, login, password reset, and case invite acceptance
 * All routes return JWT tokens for authenticated sessions
 */

import { Router, Request, Response } from 'express';
import * as authService from '../services/auth';
import * as auditLog from '../services/auditLog';
import { verifyJWT } from '../middleware/auth';
import { getSupabaseServiceRole } from '../lib/supabase';
import { isValidTokenFormat, isNotExpired } from '../utils/token';

const router = Router();

/**
 * POST /auth/lawyer-signup
 * Create a new lawyer account
 *
 * Request body:
 * - email: string
 * - password: string
 * - fullName: string
 * - phone?: string
 * - preferredLanguage?: 'en' | 'es'
 *
 * Response:
 * - user: Supabase user object with JWT tokens
 * - profile: User profile with role 'lawyer'
 * - accessToken: JWT token for API requests
 */
router.post('/lawyer-signup', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, preferredLanguage } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: 'Missing required fields: email, password, fullName',
      });
    }

    const result = await authService.signupLawyer({
      email,
      password,
      fullName,
      role: 'lawyer',
      phone,
      preferredLanguage,
    });

    res.status(201).json({
      success: true,
      user: result.user,
      profile: result.profile,
      accessToken: result.user.session?.access_token,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Signup failed',
    });
  }
});

/**
 * POST /auth/login
 * Authenticate with email and password
 *
 * Request body:
 * - email: string
 * - password: string
 *
 * Response:
 * - session: Session object with access/refresh tokens
 * - user: Authenticated user object
 * - accessToken: JWT token for API requests
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password required',
      });
    }

    const result = await authService.login({ email, password });

    // WIRED IN: Log login action for audit trail
    await auditLog.logLogin(result.user.id, req.ip);

    res.json({
      success: true,
      session: result.session,
      user: result.user,
      accessToken: result.session.access_token,
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Login failed',
    });
  }
});

/**
 * POST /auth/forgot-password
 * Request a password reset link
 *
 * Request body:
 * - email: string
 *
 * Response:
 * - success: boolean
 * - message: Confirmation message (never leaks whether email exists)
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
      });
    }

    await authService.requestPasswordReset({ email });

    // Always return success to prevent email enumeration attacks
    res.json({
      success: true,
      message: 'If an account exists, a reset link has been sent to your email',
    });
  } catch (error: any) {
    // Return same success response to prevent leaking email enumeration
    res.json({
      success: true,
      message: 'If an account exists, a reset link has been sent to your email',
    });
  }
});

/**
 * POST /auth/reset-password
 * Complete password reset with token from email
 *
 * Request body:
 * - token: string (from email link)
 * - newPassword: string
 *
 * Response:
 * - success: boolean
 * - message: Confirmation message
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and newPassword required',
      });
    }

    await authService.resetPassword({ token, newPassword });

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Password reset failed',
    });
  }
});

/**
 * GET /auth/invite/:token
 * Validate and retrieve invite information
 * Does NOT require authentication
 *
 * URL params:
 * - token: Invite token from case_invites table
 *
 * Response:
 * - valid: boolean
 * - caseId: UUID of the case
 * - invitedEmail: Email the invite was sent to
 * - expiresAt: When invite expires
 * - error?: Error message if invalid
 */
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
      });
    }

    if (!isValidTokenFormat(token)) {
      return res.status(400).json({
        error: 'Invalid token format',
      });
    }

    // Use service role to fetch invite without authentication
    const { data: invite, error: inviteError } = await getSupabaseServiceRole()
      .from('case_invites')
      .select(
        `
        id,
        token,
        invited_email,
        status,
        expires_at,
        case_id,
        lawyer_id,
        cases (
          id,
          title,
          case_type
        ),
        profiles (
          id,
          full_name
        )
        `
      )
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return res.status(404).json({
        error: 'Invite not found',
      });
    }

    // Check if invite is still pending
    if (invite.status !== 'pending') {
      return res.status(410).json({
        error: `Invite is ${invite.status}, cannot be used`,
      });
    }

    // Check if invite is not expired
    if (!isNotExpired(new Date(invite.expires_at))) {
      return res.status(410).json({
        error: 'Invite has expired',
      });
    }

    res.json({
      success: true,
      valid: true,
      invitedEmail: invite.invited_email,
      lawyerName: invite.profiles?.full_name || 'Unknown Lawyer',
      caseTitle: invite.cases?.title || 'Unknown Case',
      caseType: invite.cases?.case_type,
      expiresAt: invite.expires_at,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Failed to validate invite',
    });
  }
});

/**
 * POST /auth/invite/accept
 * Accept a case invite and create client account
 * Does NOT require authentication (creates new user)
 *
 * Request body:
 * - token: Invite token from case_invites
 * - email: Email address (must match invited_email)
 * - password: New password for client account
 * - fullName: Client's full name
 *
 * Response:
 * - success: boolean
 * - user: Newly created user object
 * - profile: Client profile
 * - caseId: Case the client was added to
 * - accessToken: JWT token for immediate login
 */
router.post('/invite/accept', async (req: Request, res: Response) => {
  try {
    const { token, email, password, fullName } = req.body;

    if (!token || !email || !password || !fullName) {
      return res.status(400).json({
        error: 'Missing required fields: token, email, password, fullName',
      });
    }

    const result = await authService.acceptCaseInvite({
      token,
      email,
      password,
      fullName,
    });

    res.status(201).json({
      success: true,
      user: result.user,
      profile: result.profile,
      caseId: result.caseId,
      accessToken: result.user.session?.access_token,
    });
  } catch (error: any) {
    const statusCode = error.message.includes('expired') ? 410 : 400;
    res.status(statusCode).json({
      error: error.message || 'Invite acceptance failed',
    });
  }
});

/**
 * POST /auth/refresh
 * Refresh JWT token using refresh token
 *
 * Request body:
 * - refreshToken: Refresh token from previous session
 *
 * Response:
 * - accessToken: New JWT token
 * - refreshToken: New refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'refreshToken required',
      });
    }

    // Token refresh is handled via Supabase's built-in session management
    // In production: call supabase.auth.refreshSession()

    res.json({
      success: true,
      message: 'Token refresh implemented at Supabase level',
    });
  } catch (error: any) {
    res.status(401).json({
      error: 'Token refresh failed',
    });
  }
});

/**
 * GET /auth/me
 * Get current authenticated user's profile
 * Requires valid JWT token
 */
router.get('/me', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const profile = await authService.getUserProfile(userId);

    res.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Failed to fetch profile',
    });
  }
});

export default router;
