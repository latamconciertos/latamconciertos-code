-- ============================================
-- FESTIVALS SYSTEM - Independent Entity
-- ============================================

-- Create festivals table
CREATE TABLE public.festivals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(300) NOT NULL,
  slug VARCHAR(350) NOT NULL UNIQUE,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  promoter_id UUID REFERENCES public.promoters(id) ON DELETE SET NULL,
  image_url TEXT,
  ticket_url TEXT,
  edition INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create festival_lineup table for artists per day
CREATE TABLE public.festival_lineup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  festival_id UUID NOT NULL REFERENCES public.festivals(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  performance_date DATE,
  stage VARCHAR(100),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(festival_id, artist_id, performance_date)
);

-- Create indexes for better performance
CREATE INDEX idx_festivals_slug ON public.festivals(slug);
CREATE INDEX idx_festivals_start_date ON public.festivals(start_date);
CREATE INDEX idx_festivals_venue_id ON public.festivals(venue_id);
CREATE INDEX idx_festivals_promoter_id ON public.festivals(promoter_id);
CREATE INDEX idx_festivals_is_featured ON public.festivals(is_featured);
CREATE INDEX idx_festival_lineup_festival_id ON public.festival_lineup(festival_id);
CREATE INDEX idx_festival_lineup_artist_id ON public.festival_lineup(artist_id);
CREATE INDEX idx_festival_lineup_performance_date ON public.festival_lineup(performance_date);

-- Enable RLS on both tables
ALTER TABLE public.festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festival_lineup ENABLE ROW LEVEL SECURITY;

-- RLS Policies for festivals
CREATE POLICY "Public can view festivals"
  ON public.festivals
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage festivals"
  ON public.festivals
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for festival_lineup
CREATE POLICY "Public can view festival lineup"
  ON public.festival_lineup
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage festival lineup"
  ON public.festival_lineup
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Add trigger for updated_at on festivals
CREATE TRIGGER update_festivals_updated_at
  BEFORE UPDATE ON public.festivals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();