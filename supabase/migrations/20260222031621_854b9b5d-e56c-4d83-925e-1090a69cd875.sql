
-- =====================================================
-- Phase 1: Resident Auto-Profile Schema Changes
-- =====================================================

-- 1.1 Create caerhold_resident_profile_jobs table
CREATE TABLE public.caerhold_resident_profile_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_hash text UNIQUE NOT NULL,
  upload_batch_id uuid NOT NULL,
  media_id uuid NOT NULL REFERENCES public.caerhold_media(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  result_resident_id uuid REFERENCES public.caerhold_residents(id) ON DELETE SET NULL,
  raw_model_output jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for profile jobs
ALTER TABLE public.caerhold_resident_profile_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caerhold admins can manage profile jobs"
  ON public.caerhold_resident_profile_jobs
  FOR ALL
  USING (is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Caerhold admins can view profile jobs"
  ON public.caerhold_resident_profile_jobs
  FOR SELECT
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_caerhold_resident_profile_jobs_updated_at
  BEFORE UPDATE ON public.caerhold_resident_profile_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.2 Extend caerhold_residents with new columns
ALTER TABLE public.caerhold_residents
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN personality jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN lore_hooks jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN profile_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN source_media_id uuid REFERENCES public.caerhold_media(id) ON DELETE SET NULL;

-- Set existing residents to 'published' so they remain visible
UPDATE public.caerhold_residents SET profile_status = 'published' WHERE profile_status = 'draft';

-- 1.3 Update RLS: replace public SELECT policy to hide drafts
DROP POLICY IF EXISTS "Residents are publicly viewable" ON public.caerhold_residents;

CREATE POLICY "Residents are publicly viewable"
  ON public.caerhold_residents
  FOR SELECT
  USING (profile_status = 'published' OR is_caerhold_admin_or_editor(auth.uid()));
