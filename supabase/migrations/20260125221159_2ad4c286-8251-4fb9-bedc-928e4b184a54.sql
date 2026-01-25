-- Create media_tags table for organizing images
CREATE TABLE public.media_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#000000',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view tags
CREATE POLICY "Tags are viewable by everyone" 
ON public.media_tags FOR SELECT 
USING (true);

-- Only admin/editor can manage tags
CREATE POLICY "Admin/Editor can manage media tags" 
ON public.media_tags FOR ALL 
USING (is_admin_or_editor(auth.uid()));

-- Create media_files table to track files with metadata
CREATE TABLE public.media_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  storage_path TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  original_filename TEXT,
  alt_text TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- Everyone can view media files
CREATE POLICY "Media files are viewable by everyone" 
ON public.media_files FOR SELECT 
USING (true);

-- Admin/Editor can manage media files
CREATE POLICY "Admin/Editor can manage media files" 
ON public.media_files FOR ALL 
USING (is_admin_or_editor(auth.uid()));

-- Create junction table for media file tags
CREATE TABLE public.media_file_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_file_id UUID NOT NULL REFERENCES public.media_files(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.media_tags(id) ON DELETE CASCADE,
  UNIQUE(media_file_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.media_file_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view tag assignments
CREATE POLICY "Tag assignments are viewable by everyone" 
ON public.media_file_tags FOR SELECT 
USING (true);

-- Admin/Editor can manage tag assignments
CREATE POLICY "Admin/Editor can manage tag assignments" 
ON public.media_file_tags FOR ALL 
USING (is_admin_or_editor(auth.uid()));

-- Create page_sections table for CMS content
CREATE TABLE public.page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'text',
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_slug, section_key)
);

-- Enable RLS
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

-- Everyone can view visible sections
CREATE POLICY "Visible sections are viewable by everyone" 
ON public.page_sections FOR SELECT 
USING (is_visible = true OR is_admin_or_editor(auth.uid()));

-- Admin/Editor can manage sections
CREATE POLICY "Admin/Editor can manage page sections" 
ON public.page_sections FOR ALL 
USING (is_admin_or_editor(auth.uid()));

-- Add trigger for updated_at on media_files
CREATE TRIGGER update_media_files_updated_at
BEFORE UPDATE ON public.media_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on page_sections
CREATE TRIGGER update_page_sections_updated_at
BEFORE UPDATE ON public.page_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default homepage sections
INSERT INTO public.page_sections (page_slug, section_key, section_type, title, content, sort_order) VALUES
('home', 'hero', 'hero', 'Hero Section', '{"headline": "Architecture in Miniature", "subheadline": "Precision-engineered building systems for the discerning collector.", "background_image": "/src/assets/hero-city.jpg", "cta_text": "View Collection", "cta_link": "/shop"}', 1),
('home', 'features', 'feature_grid', 'Feature Grid', '{"features": [{"icon": "Ruler", "title": "MILS Standard", "description": "Precision-engineered to Modular Integrated Landscaping Standard specifications."}, {"icon": "Layers", "title": "System Architecture", "description": "Each kit is part of a larger urban ecosystem, designed for seamless integration."}, {"icon": "Package", "title": "Complete Systems", "description": "From structure to landscape, every component considered and included."}]}', 2),
('home', 'new_arrivals', 'product_grid', 'New Arrivals', '{"title": "New Arrivals", "show_count": 3}', 3);

-- Insert default about page sections
INSERT INTO public.page_sections (page_slug, section_key, section_type, title, content, sort_order) VALUES
('about', 'hero', 'hero', 'About Hero', '{"headline": "About Studio Assembly", "subheadline": "A spatial design practice documenting urban systems at 1:48 scale."}', 1),
('about', 'intro', 'text', 'Introduction', '{"body": "Studio Assembly approaches brick building as architectural practice. Each project is developed with the same rigor applied to full-scale design: site analysis, structural logic, and considered material selection."}', 2),
('about', 'philosophy', 'text_image', 'Philosophy', '{"title": "Design Philosophy", "body": "We believe that constraints breed creativity. Working within the modular grid system, we develop structures that balance technical precision with expressive form.", "image": "/src/assets/about-builder.jpg", "image_position": "right"}', 3),
('about', 'city', 'text_image', 'City of Caerhold', '{"title": "The City of Caerhold", "body": "More than a collection of buildings, Caerhold is an evolving urban narrative. Each structure contributes to a coherent cityscape, with shared infrastructure, consistent scale, and interconnected stories.", "image": "/src/assets/city-wireframe.jpg", "image_position": "left"}', 4);