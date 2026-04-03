-- Add spotify_embed_url column to concerts table
-- This field stores the Spotify embed URL that can be displayed on concert pages
-- Examples: playlist, album, artist, or track embeds

ALTER TABLE public.concerts 
ADD COLUMN IF NOT EXISTS spotify_embed_url TEXT;

COMMENT ON COLUMN public.concerts.spotify_embed_url IS 'Spotify embed URL (playlist, album, artist, or track) to display on concert pages';
