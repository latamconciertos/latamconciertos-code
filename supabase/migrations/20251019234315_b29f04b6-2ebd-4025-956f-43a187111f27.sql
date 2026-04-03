-- Add event_type to concerts table
ALTER TABLE public.concerts ADD COLUMN event_type text NOT NULL DEFAULT 'concert';
ALTER TABLE public.concerts ADD CONSTRAINT concerts_event_type_check 
  CHECK (event_type IN ('concert', 'festival'));

-- Create festival_artists junction table for many-to-many relationship
CREATE TABLE public.festival_artists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concert_id uuid NOT NULL REFERENCES public.concerts(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(concert_id, artist_id)
);

-- Enable RLS on festival_artists
ALTER TABLE public.festival_artists ENABLE ROW LEVEL SECURITY;

-- RLS policies for festival_artists
CREATE POLICY "Public can view festival artists"
  ON public.festival_artists
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage festival artists"
  ON public.festival_artists
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create index for better query performance
CREATE INDEX idx_festival_artists_concert_id ON public.festival_artists(concert_id);
CREATE INDEX idx_festival_artists_artist_id ON public.festival_artists(artist_id);

-- Add comment to document the schema
COMMENT ON TABLE public.festival_artists IS 'Junction table for many-to-many relationship between festivals and artists';
COMMENT ON COLUMN public.concerts.event_type IS 'Type of event: concert (single artist) or festival (multiple artists)';