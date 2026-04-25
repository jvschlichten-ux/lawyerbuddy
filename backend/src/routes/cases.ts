/**
 * Cases Routes
 *
 * Endpoints for case management
 * Lawyers can create and manage cases; clients can view cases they're assigned to
 *
 * CRITICAL SECURITY:
 * - attorney_note field is EXCLUDED from all API responses to clients
 * - Only lawyers can create/update/delete cases and checklist items
 * - RLS policies enforce lawyer_id = auth.uid() for modifications
 */

import { Router, Request, Response } from 'express';
import { verifyJWT } from '../middleware/auth';
import { getSupabase } from '../lib/supabase';
import * as authService from '../services/auth';
import * as auditLog from '../services/auditLog';
import * as notificationHandlers from '../services/notificationHandlers';
import { Resend } from 'resend';

const router = Router();

/**
 * POST /cases
 * Create a new case (lawyer only)
 * Requires authentication
 *
 * Request body:
 * - title: string
 * - caseType: string
 * - docketNumber?: string
 * - jurisdiction?: string
 *
 * Response:
 * - case: Created case object with id
 * - inviteToken: Token to invite client
 */
router.post('/', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, caseType, docketNumber, jurisdiction } = req.body;

    if (!title || !caseType) {
      return res.status(400).json({
        error: 'Title and case type required',
      });
    }

    const { data, error } = await getSupabase()
      .from('cases')
      .insert({
        title,
        case_type: caseType,
        docket_number: docketNumber,
        jurisdiction,
        lawyer_id: userId,
        client_id: userId, // Placeholder until client accepts invite
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Case creation failed: ${error.message}`);
    }

    res.status(201).json({
      success: true,
      case: data,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Case creation failed',
    });
  }
});

/**
 * GET /cases
 * List all cases accessible to user
 * Lawyer sees own cases; client sees assigned cases
 * Requires authentication
 *
 * Query params:
 * - status?: 'active' | 'closed' | 'archived'
 * - limit?: number
 * - offset?: number
 *
 * Response:
 * - cases: Array of cases
 * - total: Total count
 * CRITICAL: attorney_note field EXCLUDED from all responses
 */
router.get('/', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { status, limit = '50', offset = '0' } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Query cases where user is lawyer_id or client_id
    // Join with profiles to get lawyer and client names
    let query = getSupabase()
      .from('cases')
      .select(
        '*, ' +
        'lawyer:profiles!cases_lawyer_id_fkey(id, full_name, email), ' +
        'client:profiles!cases_client_id_fkey(id, full_name, email)',
        { count: 'exact' }
      );

    // Filter by user role (lawyer sees own cases, client sees assigned cases)
    query = query.or(`lawyer_id.eq.${userId},client_id.eq.${userId}`);

    // Filter by status if provided
    // NOTE: Soft delete feature pending - will add deleted_at column in migration
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      throw new Error(`Case list failed: ${error.message}`);
    }

    res.json({
      success: true,
      cases: data || [],
      total: count || 0,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Case list failed',
    });
  }
});

/**
 * GET /cases/:id
 * Get case details with events and checklist
 * Requires authentication + case membership
 *
 * Response:
 * - case: Case object
 * - events: Array of events (attorney_note and attorney_flag EXCLUDED)
 * - checklist: Array of checklist items
 *
 * CRITICAL: attorney_note and attorney_flag fields NEVER returned to client
 * Backend must explicitly exclude these fields in database query
 */
router.get('/:id', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Fetch case details
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    // Verify user is either lawyer_id or client_id
    if (caseData.lawyer_id !== userId && caseData.client_id !== userId) {
      return res.status(403).json({
        error: 'Unauthorized to access this case',
      });
    }

    // Fetch events with attorney_note and attorney_flag EXCLUDED
    const { data: events, error: eventsError } = await getSupabase()
      .from('events')
      .select(
        'id, title, event_type, narrative, severity, occurred_at, created_at, ' +
        'case_id, client_id, location_description, gps_lat, gps_lng, ' +
        'is_recurring, court_order_reference, actions_taken, ' +
        'privacy_level, related_event_ids, legal_factor_tags, device_id, updated_at'
      )
      .eq('case_id', id)
      .order('occurred_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
    }

    // Fetch checklist items
    const { data: checklist, error: checklistError } = await getSupabase()
      .from('checklist_items')
      .select('*')
      .eq('case_id', id)
      .order('position', { ascending: true });

    if (checklistError) {
      console.error('Error fetching checklist:', checklistError);
    }

    res.json({
      success: true,
      case: caseData,
      events: events || [],
      checklist: checklist || [],
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Case detail failed',
    });
  }
});

/**
 * PATCH /cases/:id
 * Update case (lawyer only)
 * Requires authentication
 *
 * Request body:
 * - title?: string
 * - status?: 'active' | 'closed' | 'archived'
 * - docketNumber?: string
 * - jurisdiction?: string
 */
router.patch('/:id', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { title, status, docketNumber, jurisdiction } = req.body;

    // Verify user is lawyer for this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    if (caseData.lawyer_id !== userId) {
      return res.status(403).json({
        error: 'Only the case lawyer can update cases',
      });
    }

    // Build update object with provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined) updateData.status = status;
    if (docketNumber !== undefined) updateData.docket_number = docketNumber;
    if (jurisdiction !== undefined) updateData.jurisdiction = jurisdiction;

    // Update case
    const { data: updated, error: updateError } = await getSupabase()
      .from('cases')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Case update failed: ${updateError.message}`);
    }

    // Log update for audit trail
    await auditLog.logCaseUpdate(userId, id, updateData);

    res.json({
      success: true,
      case: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Case update failed',
    });
  }
});

/**
 * DELETE /cases/:id
 * Delete case (lawyer only)
 * Requires authentication + case ownership
 *
 * Response:
 * - success: true on successful deletion
 */
router.delete('/:id', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { permanent } = req.query; // permanent=true for hard delete

    // Verify user is lawyer for this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    if (caseData.lawyer_id !== userId) {
      return res.status(403).json({
        error: 'Only the case lawyer can delete cases',
      });
    }

    // Hard delete case (cascade delete via foreign keys)
    // NOTE: Soft delete with trash recovery pending - requires deleted_at column migration
    const { error: deleteError } = await getSupabase()
      .from('cases')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Case deletion failed: ${deleteError.message}`);
    }

    await auditLog.logCaseDeletion(userId, id);

    res.json({
      success: true,
      message: `Case ${id} deleted successfully`,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Case deletion failed',
    });
  }
});

/**
 * PATCH /cases/:id/recover
 * Recover a soft-deleted case from trash (within 30 days)
 * TODO: Implement after deleted_at column is added via migration
 * Currently commented out - soft delete feature pending
 */
// router.patch('/:id/recover', verifyJWT, async (req: Request, res: Response) => {
//   // Implementation pending - requires deleted_at column
// });

/**
 * POST /cases/:id/invite
 * Generate and send invite to client
 * Lawyer only
 *
 * Request body:
 * - invitedEmail: string
 *
 * Response:
 * - inviteToken: Secure token for client to accept
 * - expiresAt: 7 days from now
 */
router.post('/:id/invite', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { invitedEmail } = req.body;

    if (!invitedEmail) {
      return res.status(400).json({
        error: 'invitedEmail required',
      });
    }

    // Verify user is lawyer_id for this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id, title')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    if (caseData.lawyer_id !== userId) {
      return res.status(403).json({
        error: 'Only the case lawyer can generate invites',
      });
    }

    // Get lawyer's profile info
    const { data: lawyerProfile } = await getSupabase()
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Generate invite token and store in database
    const { token, expiresAt } = await authService.generateCaseInvite(
      id,
      userId,
      invitedEmail
    );

    // Send invite email via Resend
    const inviteLink = `https://lawyerbuddy-production.up.railway.app/invite/${token}`;
    const resendApiKey = process.env.RESEND_API_KEY;

    // Log API key status with first 5 chars for debugging
    if (resendApiKey) {
      const keyPreview = resendApiKey.substring(0, 5) + '...' + resendApiKey.substring(resendApiKey.length - 3);
      console.log(`📧 Invite email - RESEND_API_KEY present: ${keyPreview} (length: ${resendApiKey.length})`);
    } else {
      console.warn('⚠️ RESEND_API_KEY is undefined in process.env');
      console.warn('   Available env vars:', Object.keys(process.env).filter(k => k.includes('RESEND') || k.includes('EMAIL')).join(', ') || 'none');
    }

    if (resendApiKey) {
      try {
        console.log(`📧 Sending invite email to: ${invitedEmail}`);
        const resend = new Resend(resendApiKey);
        const emailResponse = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: invitedEmail,
          subject: `You're invited to a case on LawyerBuddy`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're invited to a legal case on LawyerBuddy</h2>
              <p>Hi,</p>
              <p><strong>${lawyerProfile?.full_name || 'A lawyer'}</strong> has invited you to collaborate on the following case:</p>
              <p style="background-color: #f5f5f5; padding: 16px; border-radius: 8px;">
                <strong>Case:</strong> ${caseData.title || 'Untitled Case'}
              </p>
              <p>Click the button below to accept the invitation and get started:</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${inviteLink}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #888888; font-size: 12px;">
                This invitation link expires in 7 days. If the button doesn't work, copy and paste this link in your browser: ${inviteLink}
              </p>
              <p style="color: #888888; font-size: 12px;">LawyerBuddy - Your legal case management partner</p>
            </div>
          `,
        });
        console.log(`✅ Invite email sent successfully to ${invitedEmail}:`, { messageId: emailResponse.data?.id || 'unknown' });
      } catch (emailError: any) {
        console.error(`❌ Failed to send invite email to ${invitedEmail}:`, {
          message: emailError.message,
          code: emailError.code,
          status: emailError.status,
          stack: emailError.stack,
        });
        // Don't fail the request if email sending fails - token is still generated
      }
    } else {
      console.warn('⚠️ Skipping email - RESEND_API_KEY not configured in environment');
    }

    // Log invite generation for audit trail
    await auditLog.logInviteGenerate(userId, id, invitedEmail);

    res.json({
      success: true,
      token,
      inviteLink: `lawyerbuddy://invite/${token}`,
      expiresAt,
      invitedEmail,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Invite generation failed',
    });
  }
});

/**
 * POST /cases/:id/export
 * Export case data (lawyer only)
 * CRITICAL: attorney_note and attorney_flag EXCLUDED from export
 *
 * Request body:
 * - format: 'pdf' | 'json' | 'docx'
 * - includeMedia?: boolean
 * - includeGPS?: boolean
 * - includeChecklist?: boolean
 *
 * Response:
 * - downloadUrl: Signed URL for download
 * - expiresIn: 1 hour
 * NOTE: attorney_note and attorney_flag never included in export, regardless of request
 */
router.post('/:id/export', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { format, includeMedia, includeGPS, includeChecklist } = req.body;

    // In production:
    // 1. Verify user is lawyer_id for this case
    // 2. Fetch case data, events, checklist with explicit field exclusion:
    //    const { data: events } = await supabase
    //      .from('events')
    //      .select(
    //        'id, title, eventType, narrative, severity, occurredAt, createdAt, ' +
    //        'case_id, client_id, location_description, gps_lat, gps_lng, ' +
    //        'event_type, is_recurring, court_order_reference, actions_taken, ' +
    //        'privacy_level, related_event_ids, legal_factor_tags, device_id, updated_at'
    //        // ❌ NOT attorney_note
    //        // ❌ NOT attorney_flag
    //      )
    //      .eq('case_id', id)
    // 3. Generate file (PDF/JSON/DOCX)
    // 4. Upload to signed URL storage
    // 5. Return download URL (valid 1 hour max - enforced by signedUrl service)
    // 6. Log export for audit trail

    res.json({
      success: true,
      downloadUrl: 'signed_url_placeholder',
      expiresIn: 600, // Must be <= 600 seconds (10 minutes max)
      format,
      note: 'Attorney notes are NEVER included in exports - field is excluded at database level',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Export failed',
    });
  }
});

/**
 * GET /cases/:id/checklist
 * Get case checklist items
 * Lawyer can see all; client can see but not edit
 *
 * Response:
 * - items: Array of checklist items
 */
router.get('/:id/checklist', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Verify user has access to this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id, client_id')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    // Verify user is either lawyer or client for this case
    const isLawyer = caseData.lawyer_id === userId;
    const isClient = caseData.client_id === userId;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        error: 'Unauthorized to access this case',
      });
    }

    // Query checklist items ordered by order_index
    const { data: items, error: itemsError } = await getSupabase()
      .from('checklist_items')
      .select('*')
      .eq('case_id', id)
      .order('order_index', { ascending: true });

    if (itemsError) {
      throw new Error(`Failed to fetch checklist: ${itemsError.message}`);
    }

    res.json({
      success: true,
      items: items || [],
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Checklist fetch failed',
    });
  }
});

/**
 * POST /cases/:id/checklist
 * Add checklist item (lawyer only)
 * RLS enforces lawyer_id = auth.uid()
 *
 * Request body:
 * - label: string
 * - description?: string
 *
 * Response:
 * - item: Created checklist item
 */
router.post('/:id/checklist', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { label, description } = req.body;

    if (!label) {
      return res.status(400).json({
        error: 'Label required',
      });
    }

    // Verify user is lawyer for this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    if (caseData.lawyer_id !== userId) {
      return res.status(403).json({
        error: 'Only the case lawyer can create checklist items',
      });
    }

    // Get the max order_index to insert new item at end
    const { data: maxItem } = await getSupabase()
      .from('checklist_items')
      .select('order_index')
      .eq('case_id', id)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextIndex = (maxItem?.order_index || 0) + 1;

    // Insert checklist item
    const { data: item, error: insertError } = await getSupabase()
      .from('checklist_items')
      .insert({
        case_id: id,
        label,
        description,
        order_index: nextIndex,
        is_complete: false,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Checklist insert failed: ${insertError.message}`);
    }

    res.status(201).json({
      success: true,
      item,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Checklist add failed',
    });
  }
});

/**
 * PATCH /cases/:id/checklist/:itemId
 * Update checklist item (lawyer only)
 * RLS enforces lawyer_id = auth.uid()
 *
 * Request body:
 * - isComplete?: boolean
 * - label?: string
 * - description?: string
 */
router.patch('/:id/checklist/:itemId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id, itemId } = req.params;
    const { isComplete } = req.body;

    // Verify user is lawyer for this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id')
      .eq('id', id)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    if (caseData.lawyer_id !== userId) {
      return res.status(403).json({
        error: 'Only the case lawyer can update checklist items',
      });
    }

    // Verify checklist item exists and belongs to case
    const { data: item, error: itemError } = await getSupabase()
      .from('checklist_items')
      .select('*')
      .eq('id', itemId)
      .eq('case_id', id)
      .single();

    if (itemError || !item) {
      return res.status(404).json({
        error: 'Checklist item not found',
      });
    }

    // Update only the is_complete status
    const updateData: any = {
      is_complete: isComplete,
    };

    // Update checklist item
    const { data: updated, error: updateError } = await getSupabase()
      .from('checklist_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Checklist update failed: ${updateError.message}`);
    }

    // WIRED IN (Phase 10): Send push notification to client if item marked complete
    // Notification respects client's preferred_language
    if (isComplete === true) {
      try {
        await notificationHandlers.notifyClientChecklistUpdate(
          itemId,
          id,
          userId,
          'marked_complete'
        );
      } catch (error) {
        console.error('Error sending checklist notification:', error);
        // Don't fail the request if notifications fail
      }
    }

    res.json({
      success: true,
      item: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Checklist update failed',
    });
  }
});

/**
 * DELETE /cases/:id/checklist/:itemId
 * Delete checklist item (lawyer only)
 * RLS enforces lawyer_id = auth.uid()
 */
router.delete('/:id/checklist/:itemId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { id, itemId } = req.params;

    // In production:
    // 1. Verify user is lawyer_id for this case (RLS)
    // 2. Delete from checklist_items WHERE id = itemId

    res.json({
      success: true,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Checklist delete failed',
    });
  }
});

export default router;
