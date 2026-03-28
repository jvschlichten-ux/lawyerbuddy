/**
 * Push Notifications Service
 *
 * Handles push notifications for:
 * 1. New message to client
 * 2. New message to lawyer
 * 3. Checklist update to client
 * 4. New event to lawyer
 *
 * Each notification respects user's preferred_language field
 * Integrates with FCM (Firebase Cloud Messaging) and APNs (Apple Push Notification service)
 */

import { getSupabaseServiceRole } from '../lib/supabase';

interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    type: 'message' | 'checklist_update' | 'new_event' | 'event_reviewed';
    caseId: string;
    targetId?: string; // messageId, itemId, eventId
    deepLink: string; // URL to route to in app
  };
}

interface NotificationTemplate {
  en: { title: string; body: string };
  es: { title: string; body: string };
}

/**
 * Language-aware notification templates
 * Each scenario has English and Spanish versions
 */
const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  NEW_MESSAGE_CLIENT: {
    en: {
      title: 'New Message from Your Lawyer',
      body: 'You have a new encrypted message. Tap to view.',
    },
    es: {
      title: 'Nuevo mensaje de tu abogado',
      body: 'Tienes un nuevo mensaje cifrado. Toca para ver.',
    },
  },
  NEW_MESSAGE_LAWYER: {
    en: {
      title: 'New Message from Client',
      body: 'Your client sent an encrypted message. Tap to view.',
    },
    es: {
      title: 'Nuevo mensaje del cliente',
      body: 'Tu cliente envió un mensaje cifrado. Toca para ver.',
    },
  },
  CHECKLIST_UPDATE_CLIENT: {
    en: {
      title: 'Checklist Item Updated',
      body: 'Your lawyer updated a checklist item. Tap to view.',
    },
    es: {
      title: 'Elemento de la lista actualizado',
      body: 'Tu abogado actualizó un elemento de la lista. Toca para ver.',
    },
  },
  NEW_EVENT_LAWYER: {
    en: {
      title: 'New Event Submitted',
      body: 'Your client submitted a new incident report. Tap to review.',
    },
    es: {
      title: 'Nuevo evento enviado',
      body: 'Tu cliente envió un nuevo informe de incidente. Toca para revisar.',
    },
  },
};

/**
 * Send push notification to user
 * Respects user's preferred_language field
 *
 * @param userId - User ID to send notification to
 * @param scenario - Notification scenario
 * @param caseId - Case UUID
 * @param data - Additional data (messageId, itemId, eventId)
 * @returns Success/error status
 */
export async function sendPushNotification(
  userId: string,
  scenario: 'NEW_MESSAGE_CLIENT' | 'NEW_MESSAGE_LAWYER' | 'CHECKLIST_UPDATE_CLIENT' | 'NEW_EVENT_LAWYER',
  caseId: string,
  data: { messageId?: string; itemId?: string; eventId?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch user profile to get preferred_language and push token
    const { data: userProfile, error: profileError } = await getSupabaseServiceRole()
      .from('profiles')
      .select('id, push_notification_token, preferred_language, role')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found:', profileError);
      return { success: false, error: 'User not found' };
    }

    // If user hasn't set up push notifications, skip
    if (!userProfile.push_notification_token) {
      console.log(`User ${userId} has no push notification token`);
      return { success: false, error: 'No push token available' };
    }

    // 2. Determine language (default to 'en' if not set)
    const language = userProfile.preferred_language || 'en';
    if (!['en', 'es'].includes(language)) {
      return { success: false, error: 'Unsupported language' };
    }

    // 3. Get notification template for this scenario and language
    const template = NOTIFICATION_TEMPLATES[scenario];
    if (!template) {
      return { success: false, error: 'Unknown scenario' };
    }

    const notification = template[language as 'en' | 'es'];

    // 4. Build deep link based on scenario
    const deepLink = buildDeepLink(scenario, caseId, data);

    // 5. Build notification payload
    const payload: PushNotificationPayload = {
      title: notification.title,
      body: notification.body,
      data: {
        type: getNotificationType(scenario),
        caseId,
        targetId: data.messageId || data.itemId || data.eventId,
        deepLink,
      },
    };

    // 6. Send via FCM (Firebase Cloud Messaging)
    // In production, integrate with Firebase Admin SDK
    await sendViaFCM(userProfile.push_notification_token, payload);

    // 7. Log notification for audit trail
    await logNotification(userId, scenario, caseId);

    return { success: true };
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification via Firebase Cloud Messaging (FCM)
 *
 * In production, this would use Firebase Admin SDK:
 * ```
 * import admin from 'firebase-admin';
 *
 * await admin.messaging().send({
 *   notification: { title, body },
 *   data: { ... },
 *   token: push_notification_token,
 * });
 * ```
 */
async function sendViaFCM(
  token: string,
  payload: PushNotificationPayload
): Promise<void> {
  try {
    // Placeholder for FCM integration
    // In production: Replace with actual Firebase Admin SDK call
    console.log(`📱 Sending FCM notification to token ${token.substring(0, 10)}...`);
    console.log(`   Title: ${payload.title}`);
    console.log(`   Body: ${payload.body}`);
    console.log(`   Deep Link: ${payload.data.deepLink}`);

    // Example Firebase Admin SDK call (uncomment when integrated):
    // const admin = require('firebase-admin');
    // await admin.messaging().send({
    //   notification: {
    //     title: payload.title,
    //     body: payload.body,
    //   },
    //   data: payload.data,
    //   token,
    // });
  } catch (error) {
    console.error('FCM send error:', error);
    throw error;
  }
}

/**
 * Map scenario to notification type
 */
function getNotificationType(
  scenario: string
): 'message' | 'checklist_update' | 'new_event' | 'event_reviewed' {
  switch (scenario) {
    case 'NEW_MESSAGE_CLIENT':
    case 'NEW_MESSAGE_LAWYER':
      return 'message';
    case 'CHECKLIST_UPDATE_CLIENT':
      return 'checklist_update';
    case 'NEW_EVENT_LAWYER':
      return 'new_event';
    default:
      return 'message';
  }
}

/**
 * Build deep link URL for notification
 * Routes user to relevant screen in the app
 */
function buildDeepLink(
  scenario: string,
  caseId: string,
  data: { messageId?: string; itemId?: string; eventId?: string }
): string {
  const baseScheme = 'lawyerbuddy://';

  switch (scenario) {
    case 'NEW_MESSAGE_CLIENT':
    case 'NEW_MESSAGE_LAWYER':
      // Route to messages screen for this case
      return `${baseScheme}messages/${caseId}`;

    case 'CHECKLIST_UPDATE_CLIENT':
      // Route to checklist screen
      return `${baseScheme}lawyer/case/${caseId}/checklist`;

    case 'NEW_EVENT_LAWYER':
      // Route to event review screen
      return `${baseScheme}lawyer/case/${caseId}/event/${data.eventId}`;

    default:
      return `${baseScheme}client/case/${caseId}`;
  }
}

/**
 * Log notification for audit trail
 * Immutable log: INSERT only, no UPDATE/DELETE
 */
async function logNotification(
  userId: string,
  scenario: string,
  caseId: string
): Promise<void> {
  try {
    await supabaseServiceRole.from('audit_logs').insert({
      actor_id: userId, // System-initiated, so actor is the recipient
      action: 'push_notification_sent',
      target_type: 'notification',
      target_id: scenario,
      metadata: {
        scenario,
        case_id: caseId,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging notification:', error);
    // Don't throw — notification still sent even if logging fails
  }
}

/**
 * Update user's push notification token
 * Called when user enables notifications on device
 */
export async function updatePushNotificationToken(
  userId: string,
  token: string
): Promise<void> {
  const { error } = await supabaseServiceRole
    .from('profiles')
    .update({ push_notification_token: token })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update push token: ${error.message}`);
  }
}

/**
 * Disable push notifications for user
 * Called when user disables notifications
 */
export async function disablePushNotifications(userId: string): Promise<void> {
  const { error } = await supabaseServiceRole
    .from('profiles')
    .update({ push_notification_token: null })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to disable notifications: ${error.message}`);
  }
}
