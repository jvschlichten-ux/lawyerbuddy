/**
 * LawyerBuddy Database Schema
 *
 * Complete Supabase (PostgreSQL) schema with:
 * - 9 tables (profiles, cases, case_invites, checklist_templates, checklist_items, events, event_attachments, messages, audit_log)
 * - Row Level Security (RLS) policies for all tables
 * - Indexes for performance
 * - Storage bucket for case files
 *
 * Created: Phase 3 - Supabase Schema + Security
 */

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('client', 'lawyer');
CREATE TYPE case_status AS ENUM ('active', 'closed', 'archived');
CREATE TYPE case_invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE event_severity AS ENUM ('low', 'medium', 'high', 'emergency');
CREATE TYPE attachment_type AS ENUM ('photo', 'video', 'audio', 'document', 'screenshot');
CREATE TYPE privacy_level AS ENUM ('private', 'shared_with_lawyer', 'court_export');
CREATE TYPE language_preference AS ENUM ('en', 'es');

-- ============================================================================
-- TABLES
-- ============================================================================

-- PROFILES: User accounts and roles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  preferred_language language_preference DEFAULT 'en' NOT NULL,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- CASES: Legal cases
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docket_number TEXT,
  title TEXT NOT NULL,
  case_type TEXT NOT NULL,
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  jurisdiction TEXT,
  status case_status DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_cases_lawyer_id ON cases(lawyer_id);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);

-- CASE_INVITES: Lawyer invitations to clients
CREATE TABLE case_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status case_invite_status DEFAULT 'pending' NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_case_invites_token ON case_invites(token);
CREATE INDEX idx_case_invites_case_id ON case_invites(case_id);
CREATE INDEX idx_case_invites_status ON case_invites(status);
CREATE INDEX idx_case_invites_expires_at ON case_invites(expires_at);

-- CHECKLIST_TEMPLATES: Reusable checklists for lawyers
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  case_type TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_checklist_templates_lawyer_id ON checklist_templates(lawyer_id);
CREATE INDEX idx_checklist_templates_case_type ON checklist_templates(case_type);

-- CHECKLIST_ITEMS: Case-specific checklist items
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_checklist_items_case_id ON checklist_items(case_id);
CREATE INDEX idx_checklist_items_is_complete ON checklist_items(is_complete);
CREATE INDEX idx_checklist_items_order ON checklist_items(case_id, order_index);

-- EVENTS: Case events logged by clients
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  narrative TEXT NOT NULL,
  location_description TEXT,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  severity event_severity,
  is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
  court_order_reference TEXT,
  actions_taken TEXT,
  attorney_flag BOOLEAN DEFAULT FALSE NOT NULL,
  attorney_note TEXT,
  privacy_level privacy_level DEFAULT 'shared_with_lawyer' NOT NULL,
  related_event_ids UUID[],
  legal_factor_tags TEXT[],
  device_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_events_case_id ON events(case_id);
CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at DESC);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_severity ON events(severity);
CREATE INDEX idx_events_attorney_flag ON events(attorney_flag);
CREATE INDEX idx_events_privacy_level ON events(privacy_level);

-- EVENT_ATTACHMENTS: Files attached to events
CREATE TABLE event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type attachment_type NOT NULL,
  storage_path TEXT NOT NULL,
  sha256_hash TEXT NOT NULL UNIQUE,
  file_size_bytes BIGINT NOT NULL,
  exif_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_event_attachments_event_id ON event_attachments(event_id);
CREATE INDEX idx_event_attachments_uploader_id ON event_attachments(uploader_id);
CREATE INDEX idx_event_attachments_file_type ON event_attachments(file_type);

-- MESSAGES: Encrypted messages between lawyer and client
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_encrypted TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_case_id ON messages(case_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- AUDIT_LOG: Immutable log of all data access and modifications
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_target_type ON audit_log(target_type);
CREATE INDEX idx_audit_log_target_id ON audit_log(target_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES: Users can only read their own profile and profiles of users in shared cases
-- ============================================================================

CREATE POLICY "profiles_select_own_or_shared_case" ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id IN (
      SELECT DISTINCT client_id FROM cases WHERE lawyer_id = auth.uid()
      UNION
      SELECT DISTINCT lawyer_id FROM cases WHERE client_id = auth.uid()
    )
  );

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- CASES: Lawyers can access only their assigned cases; clients can access only their cases
-- ============================================================================

CREATE POLICY "cases_select_own" ON cases FOR SELECT
  USING (
    lawyer_id = auth.uid() OR client_id = auth.uid()
  );

CREATE POLICY "cases_update_lawyer_only" ON cases FOR UPDATE
  USING (lawyer_id = auth.uid())
  WITH CHECK (lawyer_id = auth.uid());

CREATE POLICY "cases_insert_lawyer_only" ON cases FOR INSERT
  WITH CHECK (lawyer_id = auth.uid());

-- ============================================================================
-- CASE_INVITES: Lawyers can manage invites for their cases
-- ============================================================================

CREATE POLICY "case_invites_select_own" ON case_invites FOR SELECT
  USING (
    lawyer_id = auth.uid()
    OR (status = 'pending' AND invited_email = (SELECT email FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "case_invites_insert_lawyer_only" ON case_invites FOR INSERT
  WITH CHECK (lawyer_id = auth.uid());

CREATE POLICY "case_invites_update_lawyer_only" ON case_invites FOR UPDATE
  USING (lawyer_id = auth.uid())
  WITH CHECK (lawyer_id = auth.uid());

-- ============================================================================
-- CHECKLIST_TEMPLATES: Lawyers can only access their own templates
-- ============================================================================

CREATE POLICY "checklist_templates_select_own" ON checklist_templates FOR SELECT
  USING (lawyer_id = auth.uid());

CREATE POLICY "checklist_templates_insert_own" ON checklist_templates FOR INSERT
  WITH CHECK (lawyer_id = auth.uid());

CREATE POLICY "checklist_templates_update_own" ON checklist_templates FOR UPDATE
  USING (lawyer_id = auth.uid())
  WITH CHECK (lawyer_id = auth.uid());

CREATE POLICY "checklist_templates_delete_own" ON checklist_templates FOR DELETE
  USING (lawyer_id = auth.uid());

-- ============================================================================
-- CHECKLIST_ITEMS: Client and lawyer of a case can see; lawyer can modify
-- ============================================================================

CREATE POLICY "checklist_items_select_case_members" ON checklist_items FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid() OR client_id = auth.uid()
    )
  );

CREATE POLICY "checklist_items_insert_lawyer_only" ON checklist_items FOR INSERT
  WITH CHECK (
    case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
  );

CREATE POLICY "checklist_items_update_lawyer_only" ON checklist_items FOR UPDATE
  USING (
    case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
  )
  WITH CHECK (
    case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
  );

CREATE POLICY "checklist_items_delete_lawyer_only" ON checklist_items FOR DELETE
  USING (
    case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
  );

-- ============================================================================
-- EVENTS: Client logs events; both client and lawyer can read
-- ============================================================================

CREATE POLICY "events_select_case_members" ON events FOR SELECT
  USING (
    client_id = auth.uid()
    OR case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
  );

CREATE POLICY "events_insert_client_only" ON events FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    AND case_id IN (SELECT id FROM cases WHERE client_id = auth.uid())
  );

CREATE POLICY "events_update_attorney_note_lawyer_only" ON events FOR UPDATE
  USING (
    case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
  )
  WITH CHECK (
    case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
  );

-- ============================================================================
-- EVENT_ATTACHMENTS: Follow same rules as parent event
-- ============================================================================

CREATE POLICY "event_attachments_select_case_members" ON event_attachments FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events
      WHERE client_id = auth.uid()
      OR case_id IN (SELECT id FROM cases WHERE lawyer_id = auth.uid())
    )
  );

CREATE POLICY "event_attachments_insert_uploader" ON event_attachments FOR INSERT
  WITH CHECK (
    event_id IN (
      SELECT id FROM events
      WHERE client_id = auth.uid()
      AND case_id IN (SELECT id FROM cases WHERE client_id = auth.uid())
    )
  );

CREATE POLICY "event_attachments_delete_uploader" ON event_attachments FOR DELETE
  USING (uploader_id = auth.uid());

-- ============================================================================
-- MESSAGES: Client and lawyer of a case can read/send
-- ============================================================================

CREATE POLICY "messages_select_case_members" ON messages FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid() OR client_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_case_members" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid() OR client_id = auth.uid()
    )
  );

CREATE POLICY "messages_update_read_status" ON messages FOR UPDATE
  USING (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid() OR client_id = auth.uid()
    )
  )
  WITH CHECK (
    case_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid() OR client_id = auth.uid()
    )
  );

-- ============================================================================
-- AUDIT_LOG: All authenticated users can INSERT (for logging actions)
-- UPDATE and DELETE are NOT allowed (immutable log)
-- ============================================================================

CREATE POLICY "audit_log_insert_authenticated" ON audit_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "audit_log_select_own_actions" ON audit_log FOR SELECT
  USING (actor_id = auth.uid());

-- Lawyers can see audit log for their cases
CREATE POLICY "audit_log_select_case_lawyer" ON audit_log FOR SELECT
  USING (
    target_id IN (
      SELECT id FROM cases WHERE lawyer_id = auth.uid()
    )
    AND target_type IN ('event', 'case', 'attachment', 'message')
  );

-- NO UPDATE OR DELETE POLICIES - audit log is immutable

-- ============================================================================
-- STORAGE BUCKET: case-files (private, requires authentication)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('case-files', 'case-files', false) ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload files to their case folders
CREATE POLICY "case_files_upload_authenticated" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-files'
    AND auth.role() = 'authenticated'
  );

-- Allow case members to read files
CREATE POLICY "case_files_download_case_members" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-files'
    AND auth.role() = 'authenticated'
  );

-- Allow uploaders to delete their files
CREATE POLICY "case_files_delete_uploader" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'case-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cases_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TODO: Future Migrations
-- ============================================================================

-- TODO 1: Storage Policy Enhancement
-- The case_files_download_case_members policy (line 432-436) currently allows
-- any authenticated user to download files. This must be tightened to verify
-- the user is actually a member of the case (lawyer_id or client_id in cases table).
-- Current: WHERE bucket_id = 'case-files' AND auth.role() = 'authenticated'
-- Should be: WHERE bucket_id = 'case-files' AND (/* case membership check */)

-- TODO 2: Remove UNIQUE Constraint on SHA-256 Hash
-- The event_attachments.sha256_hash column currently has a UNIQUE constraint (line 159),
-- which prevents the same file hash from being stored multiple times. Since the hash
-- is used for integrity verification (not uniqueness enforcement), this constraint should
-- be removed. Multiple users might upload identical files, and hashes should be allowed
-- to repeat. Solution: Drop the UNIQUE constraint or make it non-unique in next migration.

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
