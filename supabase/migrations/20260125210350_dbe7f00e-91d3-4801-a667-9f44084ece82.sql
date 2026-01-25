-- Phase 1: Journal/Blog System Database Schema

-- 1. Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'author');
CREATE TYPE public.post_status AS ENUM ('draft', 'scheduled', 'published', 'archived');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create journal_posts table
CREATE TABLE public.journal_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT,
  cover_image_url TEXT,
  status public.post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create post_tags junction table
CREATE TABLE public.post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.journal_posts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (post_id, tag_id)
);

-- 7. Create post_revisions table for version history
CREATE TABLE public.post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.journal_posts(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 9. Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_posts_updated_at
  BEFORE UPDATE ON public.journal_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
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

-- 11. Create function to check if user is admin or editor
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- 12. Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'editor' THEN 2
      WHEN 'author' THEN 3
    END
  LIMIT 1
$$;

-- 13. Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

-- 14. Create trigger for auto-creating profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 15. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;

-- 16. RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 17. RLS Policies for user_roles (only admins can manage)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 18. RLS Policies for tags (public read, admin/editor write)
CREATE POLICY "Tags are viewable by everyone"
  ON public.tags FOR SELECT
  USING (true);

CREATE POLICY "Admin/Editor can manage tags"
  ON public.tags FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- 19. RLS Policies for journal_posts
CREATE POLICY "Published posts are viewable by everyone"
  ON public.journal_posts FOR SELECT
  USING (
    status = 'published' 
    OR (auth.uid() IS NOT NULL AND (
      author_id = auth.uid() 
      OR public.is_admin_or_editor(auth.uid())
    ))
  );

CREATE POLICY "Authenticated users with roles can create posts"
  ON public.journal_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'editor') OR
      public.has_role(auth.uid(), 'author')
    )
  );

CREATE POLICY "Authors can update own posts, admin/editor can update all"
  ON public.journal_posts FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admin/Editor can delete posts"
  ON public.journal_posts FOR DELETE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- 20. RLS Policies for post_tags
CREATE POLICY "Post tags are viewable by everyone"
  ON public.post_tags FOR SELECT
  USING (true);

CREATE POLICY "Post author or admin/editor can manage post tags"
  ON public.post_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_posts
      WHERE id = post_id AND (
        author_id = auth.uid() OR public.is_admin_or_editor(auth.uid())
      )
    )
  );

-- 21. RLS Policies for post_revisions
CREATE POLICY "Revisions viewable by post author and admin/editor"
  ON public.post_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_posts
      WHERE id = post_id AND (
        author_id = auth.uid() OR public.is_admin_or_editor(auth.uid())
      )
    )
  );

CREATE POLICY "Post author or admin/editor can create revisions"
  ON public.post_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_posts
      WHERE id = post_id AND (
        author_id = auth.uid() OR public.is_admin_or_editor(auth.uid())
      )
    )
  );

-- 22. Create indexes for performance
CREATE INDEX idx_journal_posts_status ON public.journal_posts(status);
CREATE INDEX idx_journal_posts_author ON public.journal_posts(author_id);
CREATE INDEX idx_journal_posts_published_at ON public.journal_posts(published_at DESC);
CREATE INDEX idx_journal_posts_slug ON public.journal_posts(slug);
CREATE INDEX idx_post_tags_post ON public.post_tags(post_id);
CREATE INDEX idx_post_tags_tag ON public.post_tags(tag_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);

-- 23. Create media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- 24. Storage policies for media bucket
CREATE POLICY "Media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated users with roles can upload media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'editor') OR
      public.has_role(auth.uid(), 'author')
    )
  );

CREATE POLICY "Authenticated users with roles can update their media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media' AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'editor') OR
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Admin/Editor can delete media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media' AND public.is_admin_or_editor(auth.uid())
  );