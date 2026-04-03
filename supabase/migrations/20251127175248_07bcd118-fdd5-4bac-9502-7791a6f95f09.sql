-- Create PWA settings table
CREATE TABLE IF NOT EXISTS public.pwa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL DEFAULT 'Conciertos LATAM',
  short_name TEXT NOT NULL DEFAULT 'Conciertos',
  description TEXT DEFAULT 'Plataforma de conciertos en América Latina',
  theme_color TEXT NOT NULL DEFAULT '#1e3a8a',
  background_color TEXT NOT NULL DEFAULT '#0f172a',
  icon_192_url TEXT,
  icon_512_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.pwa_settings (app_name, short_name, description)
VALUES ('Conciertos LATAM', 'Conciertos', 'Plataforma de conciertos en América Latina')
ON CONFLICT DO NOTHING;

-- Create bucket for PWA icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('pwa-icons', 'pwa-icons', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for pwa_settings
ALTER TABLE public.pwa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage PWA settings"
ON public.pwa_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public can view PWA settings"
ON public.pwa_settings
FOR SELECT
TO public
USING (true);

-- RLS Policies for pwa-icons bucket
CREATE POLICY "Public can view PWA icons"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pwa-icons');

CREATE POLICY "Admins can upload PWA icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pwa-icons' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can update PWA icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pwa-icons' 
  AND has_role(auth.uid(), 'admin'::user_role)
);

CREATE POLICY "Admins can delete PWA icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pwa-icons' 
  AND has_role(auth.uid(), 'admin'::user_role)
);