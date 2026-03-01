
-- Junction table: multiple portrait images per resident
CREATE TABLE public.caerhold_resident_portraits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.caerhold_media(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'portrait',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(resident_id, media_id)
);

ALTER TABLE public.caerhold_resident_portraits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caerhold admins can manage resident portraits"
  ON public.caerhold_resident_portraits
  FOR ALL
  USING (is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Portraits viewable with published residents"
  ON public.caerhold_resident_portraits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caerhold_residents r
      WHERE r.id = caerhold_resident_portraits.resident_id
        AND (r.profile_status = 'published' OR is_caerhold_admin_or_editor(auth.uid()))
    )
  );
