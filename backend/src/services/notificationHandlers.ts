/**
 * Notification Handlers
 *
 * Orchestrates push notifications for 4 scenarios:
 * 1. New message to client
 * 2. New message to lawyer
 * 3. Checklist update to client
 * 4. New event to lawyer
 *
 * Called from relevant route handlers
 */

import { sendPushNotification } from './pushNotifications';
import { getSupabaseServiceRole } from '../lib/supabase';

/**
 * SCENARIO 1: New message from lawyer to client
 *
 * Called from: backend/src/routes/messages.ts → POST /messages
 * When: Lawyer sends encrypted message to client
 *
 * @param messageId - Message ID
 * @param caseId - Case UUID
 * @param senderId - Lawyer's user ID
 * @returns Promise
 */
export async function notifyClientNewMessage(
  messageId: string,
  caseId: string,
  senderId: string
): Promise<void> {
  try {
    // 1. Get case to find client_id
    const { data: caseData, error: caseError } = await getSupabaseServiceRole()
      .from('cases')
      .select('client_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('Case not found:', caseError);
      return;
    }

    const clientId = caseData.client_id;

    // 2. Send push notification to client
    // Language preference is checked inside sendPushNotification
    await sendPushNotification(
      clientId,
      'NEW_MESSAGE_CLIENT',
      caseId,
      { messageId }
    );

    console.log(`✅ Notification sent to client ${clientId} for new message`);
  } catch (error) {
    console.error('Error notifying client of new message:', error);
    // Don't throw — message was already sent and stored
  }
}

/**
 * SCENARIO 2: New message from client to lawyer
 *
 * Called from: backend/src/routes/messages.ts → POST /messages
 * When: Client sends encrypted message to lawyer
 *
 * @param messageId - Message ID
 * @param caseId - Case UUID
 * @param senderId - Client's user ID
 * @returns Promise
 */
export async function notifyLawyerNewMessage(
  messageId: string,
  caseId: string,
  senderId: string
): Promise<void> {
  try {
    // 1. Get case to find lawyer_id
    const { data: caseData, error: caseError } = await getSupabaseServiceRole()
      .from('cases')
      .select('lawyer_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('Case not found:', caseError);
      return;
    }

    const lawyerId = caseData.lawyer_id;

    // 2. Send push notification to lawyer
    // Language preference is checked inside sendPushNotification
    await sendPushNotification(
      lawyerId,
      'NEW_MESSAGE_LAWYER',
      caseId,
      { messageId }
    );

    console.log(`✅ Notification sent to lawyer ${lawyerId} for new message from client`);
  } catch (error) {
    console.error('Error notifying lawyer of new message:', error);
    // Don't throw — message was already sent and stored
  }
}

/**
 * SCENARIO 3: Checklist item updated by lawyer
 *
 * Called from: backend/src/routes/cases.ts → PATCH /cases/:id/checklist/:itemId
 * When: Lawyer marks checklist item complete, adds description, or reorders
 *
 * @param itemId - Checklist item ID
 * @param caseId - Case UUID
 * @param lawyerId - Lawyer's user ID
 * @param action - Action performed (marked_complete, updated, reordered)
 * @returns Promise
 */
export async function notifyClientChecklistUpdate(
  itemId: string,
  caseId: string,
  lawyerId: string,
  action: 'marked_complete' | 'updated' | 'reordered' = 'updated'
): Promise<void> {
  try {
    // 1. Get case to find client_id
    const { data: caseData, error: caseError } = await getSupabaseServiceRole()
      .from('cases')
      .select('client_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('Case not found:', caseError);
      return;
    }

    const clientId = caseData.client_id;

    // 2. Only notify client if item was marked complete
    // (Not for minor updates like reordering)
    if (action === 'marked_complete') {
      // 3. Send push notification to client
      // Language preference is checked inside sendPushNotification
      await sendPushNotification(
        clientId,
        'CHECKLIST_UPDATE_CLIENT',
        caseId,
        { itemId }
      );

      console.log(`✅ Notification sent to client ${clientId} for checklist item marked complete`);
    }
  } catch (error) {
    console.error('Error notifying client of checklist update:', error);
    // Don't throw — checklist was already updated
  }
}

/**
 * SCENARIO 4: New event submitted by client
 *
 * Called from: backend/src/routes/events.ts → POST /events
 * When: Client creates and submits new incident event with details and media
 *
 * @param eventId - Event ID
 * @param caseId - Case UUID
 * @param clientId - Client's user ID
 * @returns Promise
 */
export async function notifyLawyerNewEvent(
  eventId: string,
  caseId: string,
  clientId: string
): Promise<void> {
  try {
    // 1. Get case to find lawyer_id
    const { data: caseData, error: caseError } = await getSupabaseServiceRole()
      .from('cases')
      .select('lawyer_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('Case not found:', caseError);
      return;
    }

    const lawyerId = caseData.lawyer_id;

    // 2. Send push notification to lawyer
    // Language preference is checked inside sendPushNotification
    await sendPushNotification(
      lawyerId,
      'NEW_EVENT_LAWYER',
      caseId,
      { eventId }
    );

    console.log(`✅ Notification sent to lawyer ${lawyerId} for new event from client`);
  } catch (error) {
    console.error('Error notifying lawyer of new event:', error);
    // Don't throw — event was already created and stored
  }
}

/**
 * FUTURE: Scenario 5 - Event reviewed by lawyer (Phase 11+)
 *
 * Called from: backend/src/routes/events.ts → PATCH /events/:caseId/:eventId
 * When: Lawyer marks event as reviewed, adds attorney notes
 *
 * @param eventId - Event ID
 * @param caseId - Case UUID
 * @param lawyerId - Lawyer's user ID
 * @returns Promise
 */
export async function notifyClientEventReviewed(
  eventId: string,
  caseId: string,
  lawyerId: string
): Promise<void> {
  try {
    // Get case to find client_id
    const { data: caseData, error: caseError } = await getSupabaseServiceRole()
      .from('cases')
      .select('client_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      console.error('Case not found:', caseError);
      return;
    }

    const clientId = caseData.client_id;

    // Send push notification to client
    // (Notification template would be: "Your lawyer reviewed your event report")
    await sendPushNotification(
      clientId,
      'NEW_EVENT_LAWYER', // Placeholder — would be 'EVENT_REVIEWED' in production
      caseId,
      { eventId }
    );

    console.log(`✅ Notification sent to client ${clientId} for event review`);
  } catch (error) {
    console.error('Error notifying client of event review:', error);
  }
}
