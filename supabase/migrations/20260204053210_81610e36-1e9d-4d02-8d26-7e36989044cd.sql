-- =====================================================
-- MIGRATION 2: Caerhold Schema - Tables, Functions, Policies
-- =====================================================

-- 1. Create enums for Caerhold
CREATE TYPE public.caerhold_author_type AS ENUM ('resident', 'location');
CREATE TYPE public.caerhold_post_status AS ENUM ('draft', 'approved', 'scheduled', 'published');
CREATE TYPE public.caerhold_location_type AS ENUM ('landmark', 'business', 'residence', 'street', 'park');

-- =====================================================
-- 2. SECURITY DEFINER FUNCTIONS (for RLS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_caerhold_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_caerhold_admin_or_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('caerhold_admin', 'caerhold_editor')
  )
$$;

-- =====================================================
-- 3. CAERHOLD TABLES
-- =====================================================

-- 3.1 Residents table
CREATE TABLE public.caerhold_residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  display_name text NOT NULL,
  handle text UNIQUE NOT NULL,
  role_title text,
  bio text,
  tone_profile jsonb NOT NULL DEFAULT '{}',
  canon_rules jsonb NOT NULL DEFAULT '{}',
  posting_enabled boolean NOT NULL DEFAULT true,
  avatar_media_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 Locations table
CREATE TABLE public.caerhold_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  type public.caerhold_location_type NOT NULL,
  description text,
  canon_rules jsonb NOT NULL DEFAULT '{}',
  hero_media_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.3 Media table
CREATE TABLE public.caerhold_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('image', 'video')),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  thumb_url text,
  upload_batch_id uuid NOT NULL,
  captured_at timestamptz,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.4 Media-Resident Tags (junction table - triggers draft creation)
CREATE TABLE public.caerhold_media_resident_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.caerhold_media(id) ON DELETE CASCADE,
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  tagged_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, resident_id)
);

-- 3.5 Media-Location Tags (junction table)
CREATE TABLE public.caerhold_media_location_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.caerhold_media(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.caerhold_locations(id) ON DELETE CASCADE,
  tagged_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, location_id)
);

-- 3.6 Posts table
CREATE TABLE public.caerhold_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_type public.caerhold_author_type NOT NULL,
  resident_id uuid REFERENCES public.caerhold_residents(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.caerhold_locations(id) ON DELETE SET NULL,
  status public.caerhold_post_status NOT NULL DEFAULT 'draft',
  caption text DEFAULT '',
  ai_caption text DEFAULT '',
  admin_notes text DEFAULT '',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT published_requires_timestamp CHECK (
    status != 'published' OR published_at IS NOT NULL
  ),
  CONSTRAINT author_type_matches_id CHECK (
    (author_type = 'resident' AND resident_id IS NOT NULL) OR
    (author_type = 'location' AND location_id IS NOT NULL)
  )
);

-- 3.7 Post-Media junction table
CREATE TABLE public.caerhold_post_media (
  post_id uuid NOT NULL REFERENCES public.caerhold_posts(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.caerhold_media(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, media_id)
);

-- 3.8 Post Generation Jobs (idempotency tracking)
CREATE TABLE public.caerhold_post_generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_hash text UNIQUE NOT NULL,
  resident_id uuid NOT NULL REFERENCES public.caerhold_residents(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.caerhold_locations(id) ON DELETE SET NULL,
  upload_batch_id uuid NOT NULL,
  draft_post_id uuid REFERENCES public.caerhold_posts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'updated', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign keys for avatar/hero media
ALTER TABLE public.caerhold_residents
  ADD CONSTRAINT fk_avatar_media
  FOREIGN KEY (avatar_media_id)
  REFERENCES public.caerhold_media(id)
  ON DELETE SET NULL;

ALTER TABLE public.caerhold_locations
  ADD CONSTRAINT fk_hero_media
  FOREIGN KEY (hero_media_id)
  REFERENCES public.caerhold_media(id)
  ON DELETE SET NULL;

-- =====================================================
-- 4. TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_caerhold_residents_updated_at
  BEFORE UPDATE ON public.caerhold_residents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_caerhold_locations_updated_at
  BEFORE UPDATE ON public.caerhold_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_caerhold_posts_updated_at
  BEFORE UPDATE ON public.caerhold_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. DRAFT GENERATION TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.caerhold_handle_resident_tag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_media RECORD;
  v_location_id uuid;
  v_location_count integer;
  v_job_hash text;
  v_existing_job RECORD;
  v_post_id uuid;
BEGIN
  SELECT * INTO v_media FROM public.caerhold_media WHERE id = NEW.media_id;
  
  IF v_media IS NULL THEN
    RAISE EXCEPTION 'Media not found: %', NEW.media_id;
  END IF;
  
  SELECT COUNT(*), MAX(location_id) INTO v_location_count, v_location_id
  FROM public.caerhold_media_location_tags
  WHERE media_id = NEW.media_id;
  
  IF v_location_count > 1 THEN
    v_location_id := NULL;
  END IF;
  
  v_job_hash := encode(
    sha256(
      (NEW.resident_id::text || v_media.upload_batch_id::text || COALESCE(v_location_id::text, 'none'))::bytea
    ),
    'hex'
  );
  
  SELECT * INTO v_existing_job FROM public.caerhold_post_generation_jobs WHERE job_hash = v_job_hash;
  
  IF v_existing_job IS NOT NULL THEN
    IF v_existing_job.draft_post_id IS NOT NULL THEN
      INSERT INTO public.caerhold_post_media (post_id, media_id)
      VALUES (v_existing_job.draft_post_id, NEW.media_id)
      ON CONFLICT (post_id, media_id) DO NOTHING;
      
      UPDATE public.caerhold_post_generation_jobs 
      SET status = 'updated' 
      WHERE id = v_existing_job.id;
    END IF;
  ELSE
    INSERT INTO public.caerhold_posts (
      author_type,
      resident_id,
      location_id,
      status,
      created_by
    ) VALUES (
      'resident',
      NEW.resident_id,
      v_location_id,
      'draft',
      NEW.tagged_by
    ) RETURNING id INTO v_post_id;
    
    INSERT INTO public.caerhold_post_media (post_id, media_id)
    VALUES (v_post_id, NEW.media_id);
    
    INSERT INTO public.caerhold_post_generation_jobs (
      job_hash,
      resident_id,
      location_id,
      upload_batch_id,
      draft_post_id,
      status
    ) VALUES (
      v_job_hash,
      NEW.resident_id,
      v_location_id,
      v_media.upload_batch_id,
      v_post_id,
      'created'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER caerhold_on_resident_tag
  AFTER INSERT ON public.caerhold_media_resident_tags
  FOR EACH ROW EXECUTE FUNCTION public.caerhold_handle_resident_tag();

-- =====================================================
-- 6. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.caerhold_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caerhold_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caerhold_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caerhold_media_resident_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caerhold_media_location_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caerhold_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caerhold_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caerhold_post_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Residents - Public read, admin write
CREATE POLICY "Residents are publicly viewable"
  ON public.caerhold_residents FOR SELECT
  USING (true);

CREATE POLICY "Caerhold admins can manage residents"
  ON public.caerhold_residents FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Locations - Public read, admin write
CREATE POLICY "Locations are publicly viewable"
  ON public.caerhold_locations FOR SELECT
  USING (true);

CREATE POLICY "Caerhold admins can manage locations"
  ON public.caerhold_locations FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Media - Read via published posts or admin, admin write
CREATE POLICY "Media viewable through published posts"
  ON public.caerhold_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caerhold_post_media pm
      JOIN public.caerhold_posts p ON p.id = pm.post_id
      WHERE pm.media_id = caerhold_media.id
        AND p.status = 'published'
    )
    OR is_caerhold_admin_or_editor(auth.uid())
  );

CREATE POLICY "Caerhold admins can manage media"
  ON public.caerhold_media FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Media-Resident Tags - Admin only
CREATE POLICY "Caerhold admins can view resident tags"
  ON public.caerhold_media_resident_tags FOR SELECT
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Caerhold admins can manage resident tags"
  ON public.caerhold_media_resident_tags FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Media-Location Tags - Admin only
CREATE POLICY "Caerhold admins can view location tags"
  ON public.caerhold_media_location_tags FOR SELECT
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Caerhold admins can manage location tags"
  ON public.caerhold_media_location_tags FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Posts - Published public, all admin
CREATE POLICY "Published posts are publicly viewable"
  ON public.caerhold_posts FOR SELECT
  USING (
    status = 'published'
    OR is_caerhold_admin_or_editor(auth.uid())
  );

CREATE POLICY "Caerhold admins can manage posts"
  ON public.caerhold_posts FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Post-Media - Same as posts
CREATE POLICY "Post media viewable with published posts"
  ON public.caerhold_post_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.caerhold_posts p
      WHERE p.id = caerhold_post_media.post_id
        AND (p.status = 'published' OR is_caerhold_admin_or_editor(auth.uid()))
    )
  );

CREATE POLICY "Caerhold admins can manage post media"
  ON public.caerhold_post_media FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- Post Generation Jobs - Admin only
CREATE POLICY "Caerhold admins can view generation jobs"
  ON public.caerhold_post_generation_jobs FOR SELECT
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

CREATE POLICY "Caerhold admins can manage generation jobs"
  ON public.caerhold_post_generation_jobs FOR ALL
  TO authenticated
  USING (is_caerhold_admin_or_editor(auth.uid()));

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_caerhold_residents_slug ON public.caerhold_residents(slug);
CREATE INDEX idx_caerhold_locations_slug ON public.caerhold_locations(slug);
CREATE INDEX idx_caerhold_locations_type ON public.caerhold_locations(type);
CREATE INDEX idx_caerhold_media_batch ON public.caerhold_media(upload_batch_id);
CREATE INDEX idx_caerhold_posts_status ON public.caerhold_posts(status);
CREATE INDEX idx_caerhold_posts_resident ON public.caerhold_posts(resident_id);
CREATE INDEX idx_caerhold_posts_location ON public.caerhold_posts(location_id);
CREATE INDEX idx_caerhold_posts_published_at ON public.caerhold_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_caerhold_jobs_hash ON public.caerhold_post_generation_jobs(job_hash);