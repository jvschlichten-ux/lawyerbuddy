/**
 * Shared TypeScript types for LawyerBuddy
 * These types will be used across the backend and frontend
 */

export type Role = 'client' | 'lawyer';

export interface UserProfile {
  id: string;
  role: Role;
  full_name: string;
  email: string;
  phone?: string;
  preferred_language: 'en' | 'es';
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  docket_number?: string;
  title: string;
  case_type: string;
  lawyer_id: string;
  client_id: string;
  jurisdiction?: string;
  status: 'active' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  case_id: string;
  client_id: string;
  title: string;
  event_type: string;
  occurred_at: string;
  created_at: string;
  narrative: string;
  location_description?: string;
  gps_lat?: number;
  gps_lng?: number;
  severity?: 'low' | 'medium' | 'high' | 'emergency';
  is_recurring: boolean;
  court_order_reference?: string;
  actions_taken?: string;
  attorney_flag: boolean;
  attorney_note?: string;
  privacy_level: 'private' | 'shared_with_lawyer' | 'court_export';
  related_event_ids?: string[];
  legal_factor_tags?: string[];
  device_id?: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  case_id: string;
  label: string;
  description?: string;
  order_index: number;
  is_complete: boolean;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
}

export interface Message {
  id: string;
  case_id: string;
  sender_id: string;
  content_encrypted: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}
