
-- =====================================================
-- Phase 1: Districts, Connections, Site Settings
-- =====================================================

-- 1. caerhold_districts
CREATE TABLE public.caerhold_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  hero_image_url text,
  sort_order int DEFAULT 0,
  is_published boolean DEFAULT true,
  map_hotspot jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_caerhold_districts_sort ON public.caerhold_districts(sort_order);
CREATE INDEX idx_caerhold_districts_published ON public.caerhold_districts(is_published);

ALTER TABLE public.caerhold_districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published districts"
  ON public.caerhold_districts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Caerhold admins can manage districts"
  ON public.caerhold_districts FOR ALL
  USING (public.is_caerhold_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_caerhold_admin_or_editor(auth.uid()));

CREATE TRIGGER update_caerhold_districts_updated_at
  BEFORE UPDATE ON public.caerhold_districts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. caerhold_resident_connections
CREATE TABLE public.caerhold_resident_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  connected_resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'friend',
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resident_id, connected_resident_id)
);

CREATE INDEX idx_caerhold_connections_resident ON public.caerhold_resident_connections(resident_id);
CREATE INDEX idx_caerhold_connections_connected ON public.caerhold_resident_connections(connected_resident_id);

ALTER TABLE public.caerhold_resident_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read connections"
  ON public.caerhold_resident_connections FOR SELECT
  USING (true);

CREATE POLICY "Caerhold admins can manage connections"
  ON public.caerhold_resident_connections FOR ALL
  USING (public.is_caerhold_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_caerhold_admin_or_editor(auth.uid()));

-- 3. caerhold_site_settings
CREATE TABLE public.caerhold_site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.caerhold_site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site settings"
  ON public.caerhold_site_settings FOR SELECT
  USING (true);

CREATE POLICY "Caerhold admins can manage site settings"
  ON public.caerhold_site_settings FOR ALL
  USING (public.is_caerhold_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_caerhold_admin_or_editor(auth.uid()));

-- 4. Add district_id to locations
ALTER TABLE public.caerhold_locations
  ADD COLUMN IF NOT EXISTS district_id uuid REFERENCES public.caerhold_districts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_caerhold_locations_district ON public.caerhold_locations(district_id);

-- 5. Add home_district_id and primary_work_location_id to residents
ALTER TABLE public.caerhold_residents
  ADD COLUMN IF NOT EXISTS home_district_id uuid REFERENCES public.caerhold_districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_work_location_id uuid REFERENCES public.caerhold_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_caerhold_residents_home_district ON public.caerhold_residents(home_district_id);
CREATE INDEX IF NOT EXISTS idx_caerhold_residents_work_location ON public.caerhold_residents(primary_work_location_id);
