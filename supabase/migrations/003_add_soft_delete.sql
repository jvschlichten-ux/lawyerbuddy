/**
 * Add soft delete support for cases table
 *
 * This migration adds a deleted_at column to track soft-deleted cases.
 * Cases are marked deleted_at but not actually removed from the database,
 * allowing 30-day trash recovery before permanent deletion.
 */

-- Add deleted_at column to cases table
ALTER TABLE public.cases ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for filtering non-deleted cases
CREATE INDEX idx_cases_deleted_at ON cases(deleted_at);

-- Create index for active (non-deleted) cases
CREATE INDEX idx_cases_active ON cases(deleted_at, status);
