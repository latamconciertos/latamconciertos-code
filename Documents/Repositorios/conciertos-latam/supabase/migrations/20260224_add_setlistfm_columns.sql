-- Add setlist.fm tracking columns to setlist_songs
-- setlistfm_id: stores the setlist.fm setlist ID to prevent duplicate imports
-- setlistfm_song_name: stores the original raw name from setlist.fm for auditing

ALTER TABLE setlist_songs
  ADD COLUMN IF NOT EXISTS setlistfm_id TEXT,
  ADD COLUMN IF NOT EXISTS setlistfm_song_name TEXT;

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlistfm_id
  ON setlist_songs (setlistfm_id);

COMMENT ON COLUMN setlist_songs.setlistfm_id IS 'The setlist.fm setlist ID this song was imported from';
COMMENT ON COLUMN setlist_songs.setlistfm_song_name IS 'Original song name as it appeared on setlist.fm (before Spotify normalization)';
