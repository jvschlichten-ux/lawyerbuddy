/**
 * Audit Log Service
 *
 * Records all significant actions for compliance and security
 * Immutable: INSERT only, no UPDATE or DELETE
 * RLS enforces that users can only see their own audit logs
 *
 * Logged Actions:
 * - User login/logout
 * - Event creation
 * - File/media upload
 * - File/media download
 * - Attorney note creation
 * - Case export
 * - Password changes
 */

import { getSupabase } from '../lib/supabase';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'SIGNUP'
  | 'PASSWORD_RESET'
  | 'EVENT_CREATE'
  | 'EVENT_UPDATE'
  | 'FILE_UPLOAD'
  | 'FILE_DOWNLOAD'
  | 'FILE_DELETE'
  | 'ATTORNEY_NOTE_CREATE'
  | 'ATTORNEY_NOTE_UPDATE'
  | 'CASE_EXPORT'
  | 'CASE_CREATE'
  | 'CASE_UPDATE'
  | 'CASE_DELETE'
  | 'CHECKLIST_UPDATE'
  | 'INVITE_GENERATE'
  | 'INVITE_ACCEPT';

export type TargetType = 'user' | 'event' | 'file' | 'case' | 'message' | 'attachment';

export interface AuditLogEntry {
  actorId: string; // User ID performing action
  action: AuditAction;
  targetType: TargetType;
  targetId: string; // UUID of affected record
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * IMMUTABLE: This logs to INSERT-only table
 *
 * @param entry - Audit log entry data
 * @returns Audit log record if successful
 *
 * SECURITY: RLS policy audit_log_insert_authenticated allows all users to INSERT
 * RLS policy audit_log_select_own_actions restricts viewing to own logs
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Validate required fields
    if (!entry.actorId || !entry.action || !entry.targetType || !entry.targetId) {
      throw new Error('Missing required audit log fields');
    }

    // Insert into audit_log table
    const { error } = await getSupabase().from('audit_log').insert({
      actor_id: entry.actorId,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      metadata: entry.metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Don't throw - logging failure shouldn't block the action
      // But do log the error for monitoring
      console.error('Audit log creation failed:', error);
    }
  } catch (error) {
    // Silently fail - audit failure shouldn't break app
    console.error('Audit log error:', error);
  }
}

/**
 * Log a login action
 *
 * @param userId - User who logged in
 * @param ipAddress - Client IP address
 */
export async function logLogin(userId: string, ipAddress?: string): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'LOGIN',
    targetType: 'user',
    targetId: userId,
    metadata: { ipAddress },
  });
}

/**
 * Log a logout action
 */
export async function logLogout(userId: string): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'LOGOUT',
    targetType: 'user',
    targetId: userId,
  });
}

/**
 * Log event creation
 *
 * @param userId - Client creating event
 * @param eventId - Created event ID
 * @param caseId - Associated case ID
 * @param metadata - Event details
 */
export async function logEventCreate(
  userId: string,
  eventId: string,
  caseId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'EVENT_CREATE',
    targetType: 'event',
    targetId: eventId,
    metadata: {
      ...metadata,
      caseId,
    },
  });
}

/**
 * Log event update (lawyer adding notes, etc)
 */
export async function logEventUpdate(
  userId: string,
  eventId: string,
  caseId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'EVENT_UPDATE',
    targetType: 'event',
    targetId: eventId,
    metadata: {
      ...metadata,
      caseId,
    },
  });
}

/**
 * Log file upload
 *
 * @param userId - User uploading file
 * @param attachmentId - Attachment record ID
 * @param fileName - Uploaded file name
 * @param fileSize - File size in bytes
 */
export async function logFileUpload(
  userId: string,
  attachmentId: string,
  fileName: string,
  fileSize: number
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'FILE_UPLOAD',
    targetType: 'attachment',
    targetId: attachmentId,
    metadata: {
      fileName,
      fileSize,
    },
  });
}

/**
 * Log file download/access
 * CRITICAL: Log every file access for compliance
 *
 * @param userId - User downloading file
 * @param attachmentId - Attachment being accessed
 * @param fileName - File name
 */
export async function logFileDownload(
  userId: string,
  attachmentId: string,
  fileName: string
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'FILE_DOWNLOAD',
    targetType: 'attachment',
    targetId: attachmentId,
    metadata: {
      fileName,
      downloadTime: new Date().toISOString(),
    },
  });
}

/**
 * Log attorney note creation/update
 * CRITICAL: Track all attorney note changes
 *
 * @param userId - Lawyer creating note
 * @param eventId - Event the note is on
 * @param hasNote - Whether note was added
 */
export async function logAttorneyNoteUpdate(
  userId: string,
  eventId: string,
  hasNote: boolean
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'ATTORNEY_NOTE_UPDATE',
    targetType: 'event',
    targetId: eventId,
    metadata: {
      hasNote,
      noteAction: hasNote ? 'created' : 'removed',
    },
  });
}

/**
 * Log case export
 * CRITICAL: Track all case exports for compliance
 *
 * @param userId - Lawyer exporting case
 * @param caseId - Case being exported
 * @param format - Export format (pdf, json, docx)
 */
export async function logCaseExport(
  userId: string,
  caseId: string,
  format: string
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'CASE_EXPORT',
    targetType: 'case',
    targetId: caseId,
    metadata: {
      format,
      exportTime: new Date().toISOString(),
    },
  });
}

/**
 * Log password reset
 */
export async function logPasswordReset(userId: string): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'PASSWORD_RESET',
    targetType: 'user',
    targetId: userId,
  });
}

/**
 * Log invite generation
 */
export async function logInviteGenerate(
  userId: string,
  caseId: string,
  invitedEmail: string
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'INVITE_GENERATE',
    targetType: 'case',
    targetId: caseId,
    metadata: {
      invitedEmail,
    },
  });
}

/**
 * Log invite acceptance (client signup via invite)
 */
export async function logInviteAccept(
  userId: string,
  caseId: string,
  email: string
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'INVITE_ACCEPT',
    targetType: 'case',
    targetId: caseId,
    metadata: {
      email,
    },
  });
}

/**
 * Log case update (status change, archive, etc)
 *
 * @param userId - Lawyer updating case
 * @param caseId - Case being updated
 * @param updates - Fields that were updated
 */
export async function logCaseUpdate(
  userId: string,
  caseId: string,
  updates: Record<string, any>
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'CASE_UPDATE',
    targetType: 'case',
    targetId: caseId,
    metadata: {
      updates,
      updateTime: new Date().toISOString(),
    },
  });
}

/**
 * Log case deletion
 * CRITICAL: Track all case deletions for compliance
 *
 * @param userId - Lawyer deleting case
 * @param caseId - Case being deleted
 */
export async function logCaseDeletion(
  userId: string,
  caseId: string
): Promise<void> {
  await createAuditLog({
    actorId: userId,
    action: 'CASE_DELETE',
    targetType: 'case',
    targetId: caseId,
    metadata: {
      deletionTime: new Date().toISOString(),
    },
  });
}

/**
 * Get audit log for a case (lawyer only)
 * RLS policy enforces that lawyer can only see their own cases' logs
 *
 * @param caseId - Case to get audit log for
 * @returns Array of audit log entries
 */
export async function getCaseAuditLog(caseId: string): Promise<any[]> {
  try {
    const { data, error } = await getSupabase()
      .from('audit_log')
      .select('*')
      .eq('target_id', caseId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Audit log retrieval failed:', error);
    return [];
  }
}

/**
 * Get user's own audit log
 * RLS policy restricts to own logs
 *
 * @param userId - User to get audit log for
 * @returns Array of audit log entries
 */
export async function getUserAuditLog(userId: string): Promise<any[]> {
  try {
    const { data, error } = await getSupabase()
      .from('audit_log')
      .select('*')
      .eq('actor_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('User audit log retrieval failed:', error);
    return [];
  }
}
