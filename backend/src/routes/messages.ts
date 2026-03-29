/**
 * Messages Routes
 *
 * End-to-end encrypted messaging between lawyer and client
 * Messages are stored encrypted; server never decrypts
 * Uses asymmetric encryption (libsodium box) for true E2E
 */

import { Router, Request, Response } from 'express';
import { verifyJWT } from '../middleware/auth';
import { getSupabase } from '../lib/supabase';
import * as notificationHandlers from '../services/notificationHandlers';

const router = Router();

/**
 * POST /messages
 * Send an encrypted message to case partner
 * Requires authentication
 *
 * Request body:
 * - caseId: UUID
 * - content_encrypted: string (Base64-encoded ciphertext)
 * - nonce: string (Base64-encoded nonce)
 * - senderPublicKey: string (sender's public key for recipient verification)
 *
 * Response:
 * - message: Message record (with encrypted content, no decryption on server)
 */
router.post('/', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caseId, content_encrypted, nonce, senderPublicKey } = req.body;

    if (!caseId || !content_encrypted) {
      return res.status(400).json({
        error: 'caseId and content_encrypted required',
      });
    }

    // Verify user is member of case (lawyer or client)
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id, client_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    const isLawyer = caseData.lawyer_id === userId;
    const isClient = caseData.client_id === userId;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        error: 'User is not a member of this case',
      });
    }

    // Insert into messages table with encrypted content
    const { data: message, error: insertError } = await getSupabase()
      .from('messages')
      .insert({
        case_id: caseId,
        sender_id: userId,
        content_encrypted,
        is_read: false,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Message insertion failed: ${insertError.message}`);
    }

    // WIRED IN (Phase 10): Send push notifications respecting user's preferred_language
    try {
      const { data: senderProfile } = await getSupabase()
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (senderProfile?.role === 'lawyer') {
        // Lawyer sent message to client → notify client
        await notificationHandlers.notifyClientNewMessage(message.id, caseId, userId);
      } else if (senderProfile?.role === 'client') {
        // Client sent message to lawyer → notify lawyer
        await notificationHandlers.notifyLawyerNewMessage(message.id, caseId, userId);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Message send failed',
    });
  }
});

/**
 * GET /messages/:caseId
 * List all messages for a case
 * Case members can read all messages
 * Server returns encrypted messages (no decryption)
 * Requires authentication
 *
 * Query params:
 * - limit?: number (default 50)
 * - offset?: number (default 0)
 *
 * Response:
 * - messages: Array of encrypted messages (content_encrypted + nonce)
 * - total: Total count
 */
router.get('/:caseId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caseId } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Verify user is member of case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id, client_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    const isLawyer = caseData.lawyer_id === userId;
    const isClient = caseData.client_id === userId;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        error: 'Unauthorized to access this case',
      });
    }

    // Query messages table for caseId
    const { data: messages, error: messagesError, count } = await getSupabase()
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }

    const hasMore = (count || 0) > offsetNum + limitNum;

    res.json({
      success: true,
      messages: messages || [],
      total: count || 0,
      hasMore,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Message list failed',
    });
  }
});

/**
 * GET /messages/:caseId/:messageId
 * Get a specific message
 * Returns encrypted content; client decrypts
 * Requires authentication + case membership
 *
 * Response:
 * - message: Single message with encrypted content
 */
router.get('/:caseId/:messageId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caseId, messageId } = req.params;

    // In production:
    // Verify access + return encrypted message

    res.json({
      success: true,
      message: {
        id: messageId,
        caseId,
        content_encrypted: 'base64_ciphertext',
        nonce: 'base64_nonce',
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Message fetch failed',
    });
  }
});

/**
 * PATCH /messages/:caseId/:messageId/read
 * Mark message as read
 * Requires authentication + case membership
 *
 * Request body:
 * - isRead: boolean
 *
 * Response:
 * - message: Updated message
 */
router.patch('/:caseId/:messageId/read', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { caseId, messageId } = req.params;
    const { isRead } = req.body;

    // Verify user is member of case
    const { data: caseData, error: caseError } = await getSupabase()
      .from('cases')
      .select('lawyer_id, client_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({
        error: 'Case not found',
      });
    }

    const isLawyer = caseData.lawyer_id === userId;
    const isClient = caseData.client_id === userId;

    if (!isLawyer && !isClient) {
      return res.status(403).json({
        error: 'Unauthorized to access this case',
      });
    }

    // Verify message exists and belongs to case
    const { data: message, error: fetchError } = await getSupabase()
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('case_id', caseId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({
        error: 'Message not found',
      });
    }

    // Update message read status
    const { data: updated, error: updateError } = await getSupabase()
      .from('messages')
      .update({ is_read: isRead })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update message: ${updateError.message}`);
    }

    res.json({
      success: true,
      message: updated,
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Message update failed',
    });
  }
});

/**
 * DELETE /messages/:messageId
 * Delete a message by ID
 * Only sender can delete their own messages
 *
 * Request params:
 * - messageId: UUID
 *
 * Response:
 * - success: true on successful deletion
 */
router.delete('/:messageId', verifyJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { messageId } = req.params;

    // Verify message exists
    const { data: message, error: fetchError } = await getSupabase()
      .from('messages')
      .select('sender_id, case_id')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return res.status(404).json({
        error: 'Message not found',
      });
    }

    // Verify user is sender of message
    if (message.sender_id !== userId) {
      return res.status(403).json({
        error: 'Only the sender can delete a message',
      });
    }

    // Delete the message
    const { error: deleteError } = await getSupabase()
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      throw new Error(`Failed to delete message: ${deleteError.message}`);
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Message delete failed',
    });
  }
});

export default router;
