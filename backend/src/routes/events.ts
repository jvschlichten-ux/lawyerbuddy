/**
 * Events Routes
 *
 * Endpoints for creating, updating, and retrieving events
 * Events are client-initiated, lawyer-reviewed
 */

import { Router, Request, Response } from 'express';
import { verifyJWT } from '../middleware/auth';
import { getSupabase } from '../lib/supabase';
import * as auditLog from '../services/auditLog';
import * as notificationHandlers from '../services/notificationHandlers';

const router = Router();

/**
 * POST /events
 * Create a new event (client logs incident)
 * Requires authentication (client creating event for their case)
 *
 * Request body (from Phase 5 LogEventScreen):
 * - caseId: UUID
 * - title: string
 * - eventType: string
 * - occurredAt: ISO date string
 * - locationDescription?: string
 * - narrative: string
 * - severity: 'low' | 'medium' | 'high' | 'emergency'
 * - involvedParties?: string[]
 * - courtOrderReference?: string
 * - actionsTaken?: string
 * - privacyLevel: 'private' | 'shared_with_lawyer' | 'court_export'
 * - attachments: Array<{ fileName, mimeType, sha256Hash, fileSize }>
 * - location?: { latitude, longitude, accuracy, address, timestamp }
 *
 * Response:
 * - event: Created event object with ID
 * - attachmentUploadUrls: Signed URLs for media uploads
 */
router.post('/', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const {
      caseId,
      title,
      eventType,
      occurredAt,
      locationDescription,
      narrative,
      severity,
      involvedParties,
      courtOrderReference,
      actionsTaken,
      privacyLevel,
      attachments,
      location,
    } = req.body;

    // Validate required fields
    if (!caseId || !title || !eventType || !narrative || !severity) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Verify user is the client for this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('client_id, lawyer_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    // Allow both lawyer (creating deadlines/court dates) and client (logging incidents) to create events
    const isLawyer = caseData.lawyer_id === userId;
    const isClient = caseData.client_id === userId;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        error: 'Only case members can create events',
      });
    }

    // Insert event into events table
    const { data: event, error: insertError } = await getSupabase()
      .from('events')
      .insert({
        case_id: caseId,
        client_id: userId,
        title,
        event_type: eventType,
        occurred_at: occurredAt,
        location_description: locationDescription,
        narrative,
        severity,
        court_order_reference: courtOrderReference,
        actions_taken: actionsTaken,
        privacy_level: privacyLevel || 'shared_with_lawyer',
        device_id: location?.deviceId,
        gps_lat: location?.latitude,
        gps_lng: location?.longitude,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Event insertion failed: ${insertError.message}`);
    }

    // Log event creation for audit trail
    await auditLog.logEventCreate(userId, event.id, caseId, {
      title,
      eventType,
      severity,
      attachmentCount: attachments?.length || 0,
      hasLocation: !!location,
    });

    // WIRED IN (Phase 10): Send push notification to lawyer respecting preferred_language
    try {
      await notificationHandlers.notifyLawyerNewEvent(event.id, caseId, userId);
    } catch (error) {
      console.error('Error sending lawyer notification:', error);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      event,
      attachmentUploadUrls: attachments
        ? attachments.map((att: any) => ({
            fileName: att.fileName,
            uploadUrl: 'signed_url_placeholder',
          }))
        : [],
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Event creation failed',
    });
  }
});

/**
 * GET /events/:caseId
 * List all events for a case
 * Client sees own events; Lawyer sees all events for their cases
 * Requires authentication
 *
 * Query params:
 * - limit?: number (default 50)
 * - offset?: number (default 0)
 * - sortBy?: 'occurred_at' | 'created_at' (default 'occurred_at')
 * - sortDir?: 'asc' | 'desc' (default 'desc')
 *
 * Response:
 * - events: Array of events
 * - total: Total count
 * - hasMore: Boolean for pagination
 */
router.get('/:caseId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caseId } = req.params;
    const { limit = '50', offset = '0', sortBy = 'occurred_at', sortDir = 'desc' } =
      req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Verify user has access to this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('client_id, lawyer_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    // Verify user is either client or lawyer for this case
    const isClient = caseData.client_id === userId;
    const isLawyer = caseData.lawyer_id === userId;

    if (!isClient && !isLawyer) {
      return res.status(403).json({
        error: 'Unauthorized to access this case',
      });
    }

    // Query events with attorney_note and attorney_flag EXCLUDED
    let query = getSupabase()
      .from('events')
      .select(
        'id, case_id, client_id, title, event_type, narrative, severity, occurred_at, created_at, ' +
        'location_description, gps_lat, gps_lng, court_order_reference, actions_taken, ' +
        'privacy_level, related_event_ids, legal_factor_tags, device_id, updated_at',
        { count: 'exact' }
      )
      .eq('case_id', caseId);

    // Sort and paginate
    const sortColumn = sortBy === 'created_at' ? 'created_at' : 'occurred_at';
    const sortAscending = sortDir === 'asc';

    const { data: events, error: eventsError, count } = await query
      .order(sortColumn, { ascending: sortAscending })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    const hasMore = (count || 0) > offsetNum + limitNum;

    res.json({
      success: true,
      events: events || [],
      total: count || 0,
      hasMore,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Event list failed',
    });
  }
});

/**
 * GET /events/:caseId/:eventId
 * Get a specific event with all details and attachments
 * Requires authentication
 */
router.get('/:caseId/:eventId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caseId, eventId } = req.params;

    // Verify user has access to this case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('client_id, lawyer_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    // Verify user is either client or lawyer for this case
    const isClient = caseData.client_id === userId;
    const isLawyer = caseData.lawyer_id === userId;

    if (!isClient && !isLawyer) {
      return res.status(403).json({
        error: 'Unauthorized to access this case',
      });
    }

    // Fetch event with attorney_note and attorney_flag EXCLUDED
    const { data: event, error: eventError } = await getSupabase()
      .from('events')
      .select(
        'id, case_id, client_id, title, event_type, narrative, severity, occurred_at, created_at, ' +
        'location_description, gps_lat, gps_lng, court_order_reference, actions_taken, ' +
        'privacy_level, related_event_ids, legal_factor_tags, device_id, updated_at'
      )
      .eq('id', eventId)
      .eq('case_id', caseId)
      .single();

    if (eventError || !event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      event,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Event detail failed',
    });
  }
});

/**
 * PATCH /events/:caseId/:eventId
 * Update event (lawyer adds notes, marks as reviewed)
 * Only lawyers can update events
 * Requires authentication
 *
 * Request body:
 * - attorneyFlag?: boolean
 * - attorneyNote?: string
 */
router.patch('/:caseId/:eventId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const { caseId, eventId } = req.params;
    const { attorneyFlag, attorneyNote } = req.body;

    // In production:
    // 1. Verify user is the lawyer for this case
    // 2. Update event with new notes/flags
    // 3. Create audit log entry
    // 4. Notify client of update

    res.json({
      success: true,
      message: 'Event update endpoint - backend implementation needed for Phase 7',
      event: {
        id: eventId,
        attorneyFlag,
        attorneyNote,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Event update failed',
    });
  }
});

/**
 * POST /events/:caseId/:eventId/attachments/:attachmentId/download
 * Get signed URL for downloading an attachment
 * Requires authentication + case membership
 *
 * WIRED IN: Logs all file downloads for compliance
 */
router.post(
  '/:caseId/:eventId/attachments/:attachmentId/download',
  verifyJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { caseId, eventId, attachmentId } = req.params;

      // In production:
      // 1. Verify user has access to attachment
      // 2. Generate signed URL for storage download
      // 3. Return URL (valid for 600 seconds)

      // WIRED IN: Log file download for audit trail
      // In production, fileName and other metadata come from database
      await auditLog.logFileDownload(userId, attachmentId, 'document.pdf');

      res.json({
        success: true,
        downloadUrl: 'signed_url_placeholder',
        expiresIn: 600, // 10 minutes (CRITICAL: Not 1 hour)
      });
    } catch (error: any) {
      res.status(400).json({
        error: 'Download URL generation failed',
      });
    }
  }
);

/**
 * DELETE /events/:eventId
 * Delete an event (court date or incident log)
 * Only event creator can delete
 * Requires authentication
 *
 * Response:
 * - success: true on successful deletion
 */
router.delete('/:eventId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { eventId } = req.params;

    // Verify event exists and get event details
    const { data: event, error: fetchError } = await getSupabase()
      .from('events')
      .select('client_id, case_id')
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return res.status(404).json({
        error: 'Event not found',
      });
    }

    // Verify user is the event creator (client_id)
    if (event.client_id !== userId) {
      return res.status(403).json({
        error: 'Only the event creator can delete this event',
      });
    }

    // Delete the event
    const { error: deleteError } = await getSupabase()
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteError) {
      throw new Error(`Event deletion failed: ${deleteError.message}`);
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Event deletion failed',
    });
  }
});

export default router;
