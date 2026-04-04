-- Concert Wrapped: Spotify user connections and wrapped snapshots

-- Store per-user Spotify OAuth tokens (server-side only)
CREATE TABLE IF NOT EXISTS spotify_user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE spotify_user_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own connection" ON spotify_user_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own connection" ON spotify_user_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connection" ON spotify_user_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own connection" ON spotify_user_connections FOR DELETE USING (auth.uid() = user_id);

-- Cache generated Wrapped data per user per year
CREATE TABLE IF NOT EXISTS wrapped_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  data JSONB NOT NULL,
  share_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

ALTER TABLE wrapped_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own wrapped" ON wrapped_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own wrapped" ON wrapped_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wrapped" ON wrapped_snapshots FOR UPDATE USING (auth.uid() = user_id);

-- Seed Wrapped badges
INSERT INTO badges (name, criteria_type, criteria_value, icon, description) VALUES
  ('Melomano 2026', 'wrapped_concerts_count', '{"count": 5, "year": 2026}', '🎵', 'Asististe a 5+ conciertos en 2026'),
  ('Festival Lover', 'wrapped_festivals_count', '{"count": 2, "year": 2026}', '🎪', 'Asististe a 2+ festivales en 2026'),
  ('Ciudad Recorrida', 'wrapped_cities_count', '{"count": 3, "year": 2026}', '🌎', 'Conciertos en 3+ ciudades en 2026'),
  ('Superfan', 'wrapped_repeat_artist', '{"count": 3, "year": 2026}', '🌟', 'Viste al mismo artista 3+ veces en 2026'),
  ('Primera Fila', 'wrapped_concerts_count', '{"count": 10, "year": 2026}', '🏆', 'Asististe a 10+ conciertos en 2026')
ON CONFLICT DO NOTHING;
