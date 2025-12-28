-- Add spotify_track_id and spotify_url columns to setlist_songs
ALTER TABLE public.setlist_songs 
ADD COLUMN IF NOT EXISTS spotify_track_id TEXT,
ADD COLUMN IF NOT EXISTS spotify_url TEXT;