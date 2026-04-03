-- Crear tabla para tracks de Spotify Charts
CREATE TABLE IF NOT EXISTS public.spotify_chart_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  position integer NOT NULL,
  track_id text NOT NULL,
  track_name text NOT NULL,
  artist_names text NOT NULL,
  album_name text NOT NULL,
  album_image_url text,
  spotify_url text NOT NULL,
  duration_ms integer,
  popularity integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(country_code, position)
);

-- Crear tabla para artistas de Spotify Charts
CREATE TABLE IF NOT EXISTS public.spotify_chart_artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  position integer NOT NULL,
  artist_id text NOT NULL,
  artist_name text NOT NULL,
  artist_image_url text,
  spotify_url text NOT NULL,
  popularity integer,
  genres text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(country_code, position)
);

-- Habilitar RLS
ALTER TABLE public.spotify_chart_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spotify_chart_artists ENABLE ROW LEVEL SECURITY;

-- Políticas para tracks: público puede ver, admins pueden editar
CREATE POLICY "Public can view spotify chart tracks"
ON public.spotify_chart_tracks
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage spotify chart tracks"
ON public.spotify_chart_tracks
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Políticas para artistas: público puede ver, admins pueden editar
CREATE POLICY "Public can view spotify chart artists"
ON public.spotify_chart_artists
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage spotify chart artists"
ON public.spotify_chart_artists
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Índices para mejorar el rendimiento
CREATE INDEX idx_spotify_tracks_country ON public.spotify_chart_tracks(country_code);
CREATE INDEX idx_spotify_artists_country ON public.spotify_chart_artists(country_code);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_spotify_tracks_updated_at
BEFORE UPDATE ON public.spotify_chart_tracks
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_spotify_artists_updated_at
BEFORE UPDATE ON public.spotify_chart_artists
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();