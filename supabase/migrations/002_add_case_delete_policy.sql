/**
 * Add DELETE RLS policy for cases table
 *
 * This migration adds the missing DELETE policy that allows lawyers to delete their own cases.
 * Previously, DELETE operations were blocked by RLS even though the backend code supported them.
 */

-- Add DELETE policy for cases (lawyer only)
CREATE POLICY "cases_delete_lawyer_only" ON public.cases FOR DELETE
  USING (lawyer_id = auth.uid());
