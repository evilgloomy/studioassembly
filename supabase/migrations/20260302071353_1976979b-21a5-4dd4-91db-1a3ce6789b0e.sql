
-- 1. Expand caerhold_location_type enum
ALTER TYPE public.caerhold_location_type ADD VALUE IF NOT EXISTS 'cafe';
ALTER TYPE public.caerhold_location_type ADD VALUE IF NOT EXISTS 'restaurant';
ALTER TYPE public.caerhold_location_type ADD VALUE IF NOT EXISTS 'retail';
ALTER TYPE public.caerhold_location_type ADD VALUE IF NOT EXISTS 'civic';
ALTER TYPE public.caerhold_location_type ADD VALUE IF NOT EXISTS 'service';
ALTER TYPE public.caerhold_location_type ADD VALUE IF NOT EXISTS 'entertainment';
ALTER TYPE public.caerhold_location_type ADD VALUE IF NOT EXISTS 'office';

-- 2. Add columns to caerhold_locations
ALTER TABLE public.caerhold_locations
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS ai_status text DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS ai_generated_json jsonb,
  ADD COLUMN IF NOT EXISTS ai_prompt_version text DEFAULT 'loc_v1',
  ADD COLUMN IF NOT EXISTS ai_locked_fields text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS short_blurb text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS vibe_tags text[],
  ADD COLUMN IF NOT EXISTS signature_items text[],
  ADD COLUMN IF NOT EXISTS visitor_tips text[];

-- 3. Create caerhold_location_media table
CREATE TABLE IF NOT EXISTS public.caerhold_location_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.caerhold_locations(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.caerhold_media(id) ON DELETE CASCADE,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_location_media_location ON public.caerhold_location_media(location_id);

ALTER TABLE public.caerhold_location_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Location media publicly viewable"
  ON public.caerhold_location_media FOR SELECT
  USING (true);

CREATE POLICY "Caerhold admins can manage location media"
  ON public.caerhold_location_media FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()))
  WITH CHECK (is_caerhold_admin_or_editor(auth.uid()));

-- 4. Create caerhold_location_owners table
CREATE TABLE IF NOT EXISTS public.caerhold_location_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.caerhold_locations(id) ON DELETE CASCADE,
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  role text DEFAULT 'owner',
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(location_id, resident_id, role)
);

CREATE INDEX IF NOT EXISTS idx_location_owners_location ON public.caerhold_location_owners(location_id);
CREATE INDEX IF NOT EXISTS idx_location_owners_resident ON public.caerhold_location_owners(resident_id);

ALTER TABLE public.caerhold_location_owners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Location owners publicly viewable"
  ON public.caerhold_location_owners FOR SELECT
  USING (true);

CREATE POLICY "Caerhold admins can manage location owners"
  ON public.caerhold_location_owners FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()))
  WITH CHECK (is_caerhold_admin_or_editor(auth.uid()));

-- 5. Add updated_at trigger to caerhold_locations (reuse existing function)
DROP TRIGGER IF EXISTS update_caerhold_locations_updated_at ON public.caerhold_locations;
CREATE TRIGGER update_caerhold_locations_updated_at
  BEFORE UPDATE ON public.caerhold_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
