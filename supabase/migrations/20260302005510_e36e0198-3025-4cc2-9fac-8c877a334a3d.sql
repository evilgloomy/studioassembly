
CREATE TABLE public.caerhold_resident_tag_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text DEFAULT '#4a7c59',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.caerhold_resident_tag_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags publicly viewable" ON public.caerhold_resident_tag_definitions
  FOR SELECT USING (true);
CREATE POLICY "Admins manage tags" ON public.caerhold_resident_tag_definitions
  FOR ALL USING (is_caerhold_admin_or_editor(auth.uid()));

CREATE TABLE public.caerhold_resident_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  tag_definition_id uuid NOT NULL REFERENCES public.caerhold_resident_tag_definitions(id) ON DELETE CASCADE,
  UNIQUE(resident_id, tag_definition_id)
);

ALTER TABLE public.caerhold_resident_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments publicly viewable" ON public.caerhold_resident_tag_assignments
  FOR SELECT USING (true);
CREATE POLICY "Admins manage assignments" ON public.caerhold_resident_tag_assignments
  FOR ALL USING (is_caerhold_admin_or_editor(auth.uid()));
