-- Create storage bucket for media (videos and images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/x-matroska', 'video/webm', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies for media bucket
CREATE POLICY "Public can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' AND
  has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  has_role(auth.uid(), 'admin'::user_role)
);

-- Create media_items table
CREATE TABLE public.media_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('video', 'image')),
  media_url TEXT,
  embed_code TEXT,
  author_id UUID REFERENCES auth.users(id),
  featured BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  summary TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on media_items
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_items
CREATE POLICY "Public can view published media items"
ON public.media_items FOR SELECT
USING (status = 'published');

CREATE POLICY "Admins can do anything with media items"
ON public.media_items FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for updated_at
CREATE TRIGGER update_media_items_updated_at
BEFORE UPDATE ON public.media_items
FOR EACH ROW
EXECUTE FUNCTION public.update_modified_column();

-- Create index for better query performance
CREATE INDEX idx_media_items_status ON public.media_items(status);
CREATE INDEX idx_media_items_type ON public.media_items(type);
CREATE INDEX idx_media_items_featured ON public.media_items(featured);
CREATE INDEX idx_media_items_position ON public.media_items(position);